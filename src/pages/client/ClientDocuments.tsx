import { useState } from 'react';
import { useClientData } from '../../store/ClientDataContext';
import { Card, Button } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Download, Upload, FileText } from 'lucide-react';

export default function ClientDocuments() {
  const { client, documents, addDocument } = useClientData();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    setUploading(true);
    try {
      const fileName = `${client.clientId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return;
      }

      const { data: urlData } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      addDocument({
        clientId: client.clientId,
        name: file.name,
        type: file.type || 'application/octet-stream',
        fileUrl: urlData?.signedUrl || '',
        uploadedBy: 'client',
      });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (doc: { id: string; name: string; fileUrl: string }) => {
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Documents</h1>

      <Card className="p-4 md:p-6 bg-white">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Upload a Document</h2>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-orange-300 transition-colors">
          <Upload size={24} className="text-gray-400 mb-2" />
          <span className="text-sm text-gray-500 font-medium">
            {uploading ? 'Uploading...' : 'Click to upload a file'}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </Card>

      <Card className="p-0 bg-white">
        {documents.length === 0 ? (
          <div className="p-6 text-sm text-gray-400 italic">No documents yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 md:p-6 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{doc.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                      <span className="ml-2 capitalize">{doc.uploadedBy}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all cursor-pointer shrink-0"
                  title="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
