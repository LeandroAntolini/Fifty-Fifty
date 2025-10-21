import { supabase } from '../src/integrations/supabase/client';
import { Imovel, ImovelStatus, ImageChanges } from '../types';
import { base64ToFile } from './utils';

const mapSupabaseImovelToImovel = (imovel: any): Imovel => ({
    ID_Imovel: imovel.id,
    ID_Corretor: imovel.id_corretor,
    Tipo: imovel.tipo,
    Finalidade: imovel.finalidade,
    Cidade: imovel.cidade,
    Estado: imovel.estado,
    Bairro: imovel.bairro,
    Valor: imovel.valor,
    Dormitorios: imovel.dormitorios,
    Metragem: imovel.metragem,
    Status: imovel.status,
    Imagens: imovel.imagens || [],
    detalhes_privados: imovel.detalhes_privados,
    CreatedAt: imovel.created_at,
});

export const getImoveisByCorretor = async (corretorId: string): Promise<Imovel[]> => {
    const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id_corretor', corretorId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching imoveis:', error);
        throw error;
    }

    return data.map(mapSupabaseImovelToImovel);
};

export const createImovel = async (imovelData: Omit<Imovel, 'ID_Imovel' | 'Status' | 'CreatedAt'> & { Imagens?: string[] }): Promise<Imovel> => {
    const { Imagens, ID_Corretor, ...rest } = imovelData;
    let imageUrls: string[] = [];

    if (Imagens && Imagens.length > 0) {
        try {
            const uploadPromises = Imagens.map(async (base64Image, index) => {
                const file = base64ToFile(base64Image, `imovel-${Date.now()}-${index}.png`);
                const filePath = `${ID_Corretor}/${file.name}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('imoveis-imagens')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('imoveis-imagens')
                    .getPublicUrl(filePath);
                
                return publicUrl;
            });

            imageUrls = await Promise.all(uploadPromises);
        } catch (error) {
            console.error('An error occurred during image upload:', error);
            throw error;
        }
    }

    const newImovelData = {
        id_corretor: ID_Corretor,
        tipo: rest.Tipo,
        finalidade: rest.Finalidade,
        cidade: rest.Cidade,
        estado: rest.Estado,
        bairro: rest.Bairro,
        valor: rest.Valor,
        dormitorios: rest.Dormitorios,
        metragem: rest.Metragem,
        imagens: imageUrls,
        detalhes_privados: rest.detalhes_privados,
        status: ImovelStatus.Ativo,
    };

    const { data, error } = await supabase
        .from('imoveis')
        .insert(newImovelData)
        .select()
        .single();

    if (error) {
        console.error('Error creating imovel:', error);
        throw error;
    }

    return mapSupabaseImovelToImovel(data);
};

export const updateImovel = async (
    imovelId: string,
    imovelData: Partial<Omit<Imovel, 'ID_Imovel' | 'ID_Corretor' | 'CreatedAt'>>,
    imageChanges?: ImageChanges
): Promise<Imovel> => {
    // Note: imageChanges is optional here, but the interface fields are required arrays.
    const { newImagesBase64 = [], imagesToDelete = [] } = imageChanges || {};

    // 1. Delete marked images from storage
    if (imagesToDelete.length > 0) {
        const filePaths = imagesToDelete.map(url => {
            const urlParts = url.split('/');
            const bucketNameIndex = urlParts.findIndex(part => part === 'imoveis-imagens');
            return bucketNameIndex !== -1 ? urlParts.slice(bucketNameIndex + 1).join('/') : '';
        }).filter(Boolean);

        if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage.from('imoveis-imagens').remove(filePaths);
            if (storageError) {
                console.error('Error deleting images:', storageError);
            }
        }
    }

    // 2. Upload new images to storage
    let newImageUrls: string[] = [];
    if (newImagesBase64.length > 0) {
        const { data: imovelOwner, error: ownerError } = await supabase.from('imoveis').select('id_corretor').eq('id', imovelId).single();
        if (ownerError || !imovelOwner) throw new Error("Imóvel não encontrado para adicionar imagens.");
        const ID_Corretor = imovelOwner.id_corretor;

        const uploadPromises = newImagesBase64.map(async (base64Image, index) => {
            const file = base64ToFile(base64Image, `imovel-${Date.now()}-${index}.png`);
            const filePath = `${ID_Corretor}/${file.name}`;
            const { error: uploadError } = await supabase.storage.from('imoveis-imagens').upload(filePath, file, { upsert: false });
            if (uploadError) throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
            const { data: { publicUrl } } = supabase.storage.from('imoveis-imagens').getPublicUrl(filePath);
            return publicUrl;
        });
        newImageUrls = await Promise.all(uploadPromises);
    }

    // 3. Get current imovel to update its image array
    const { data: currentImovel, error: fetchError } = await supabase.from('imoveis').select('imagens').eq('id', imovelId).single();
    if (fetchError) throw new Error("Não foi possível buscar os dados atuais do imóvel.");

    const currentImageUrls = currentImovel.imagens || [];
    const updatedImageUrls = currentImageUrls
        .filter(url => !imagesToDelete.includes(url))
        .concat(newImageUrls);

    // 4. Update the imovel record in the database
    const updateData = {
        tipo: imovelData.Tipo,
        finalidade: imovelData.Finalidade,
        cidade: imovelData.Cidade,
        estado: imovelData.Estado,
        bairro: imovelData.Bairro,
        valor: imovelData.Valor,
        dormitorios: imovelData.Dormitorios,
        metragem: imovelData.Metragem,
        status: imovelData.Status,
        imagens: updatedImageUrls,
        detalhes_privados: imovelData.detalhes_privados,
    };
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const { data, error } = await supabase.from('imoveis').update(updateData).eq('id', imovelId).select().single();
    if (error) {
        console.error('Error updating imovel record:', error);
        throw error;
    }
    return mapSupabaseImovelToImovel(data);
};

export const deleteImovel = async (imovelId: string, imageUrls: string[] = []) => {
    if (imageUrls && imageUrls.length > 0) {
        const filePaths = imageUrls.map(url => {
            const urlParts = url.split('/');
            const bucketNameIndex = urlParts.findIndex(part => part === 'imoveis-imagens');
            if (bucketNameIndex !== -1) {
                return urlParts.slice(bucketNameIndex + 1).join('/');
            }
            return '';
        }).filter(Boolean);

        if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage
                .from('imoveis-imagens')
                .remove(filePaths);
            if (storageError) {
                console.error('Error deleting imovel images:', storageError);
                // Continue even if image deletion fails, to delete the record
            }
        }
    }

    const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', imovelId);

    if (error) {
        console.error('Error deleting imovel:', error);
        throw error;
    }
};