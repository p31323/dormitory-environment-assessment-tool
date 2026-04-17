
import React, { useContext, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaCamera, FaTrashAlt, FaPlus } from 'react-icons/fa';

interface ImageUploadProps {
    photos: string[];
    setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ photos, setPhotos }) => {
    const { t } = useContext(LanguageContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        const remainingSlots = 6 - photos.length;
        const filesToProcess = files.slice(0, remainingSlots);

        for (const file of filesToProcess) {
            try {
                const compressedBase64 = await compressImage(file);
                setPhotos(prev => [...prev, compressedBase64]);
            } catch (error) {
                console.error("Image compression failed:", error);
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaCamera className="mr-2 text-blue-600" />
                {t('addPhotos')}
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {photos.map((photo, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img 
                            src={photo} 
                            alt={`Attachment ${index + 1}`} 
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                            title={t('deletePhoto')}
                        >
                            <FaTrashAlt size={12} />
                        </button>
                    </div>
                ))}
                
                {photos.length < 6 && (
                    <button
                        onClick={triggerFileInput}
                        className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-colors duration-200 group"
                    >
                        <FaPlus className="text-gray-400 group-hover:text-blue-500 mb-2" size={24} />
                        <span className="text-xs text-gray-500 group-hover:text-blue-600 text-center px-2">
                            {t('uploadHint')}
                        </span>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ImageUpload;
