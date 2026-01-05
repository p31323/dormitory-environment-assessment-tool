
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Fix: Explicitly cast the result of Array.from to File[] to resolve the 'unknown' type error.
        // This ensures the compiler knows the items are compatible with the browser's Blob/File type required by FileReader.
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        // Limit to 6 photos total
        const remainingSlots = 6 - photos.length;
        const filesToProcess = files.slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPhotos(prev => [...prev, base64String]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input so the same file can be uploaded again if deleted
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
