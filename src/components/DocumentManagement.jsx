// ==================== src/components/DocumentManagement.jsx ====================
import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios'; // ✅ ADDED
import {
  Upload,
  FileText,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';
import { documentAPI } from '../services/api';
import { useDocumentContext } from '../context/DocumentContext';

// ==================== CONSTANTS ====================
const FILE_CONFIG = {
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
  ],
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ACCEPTED_EXTENSIONS: '.pdf,.doc,.docx,.txt,.csv'
};

const STATUS_CONFIG = {
  pending: { color: 'bg-teal-500/10 text-yellow-700', icon: Clock, text: 'Processing' },
  processing: { color: 'bg-teal-500/10 text-teal-700', icon: Clock, text: 'Training' },
  completed: { color: 'bg-green-500/10 text-green-700', icon: CheckCircle, text: 'Ready' },
  failed: { color: 'bg-red-500/10 text-red-700', icon: AlertCircle, text: 'Failed' },
};

// ==================== HELPER FUNCTIONS ====================
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const validateFile = (file) => {
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return 'Please upload PDF, DOC, DOCX, TXT, or CSV files only';
  }
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return `File size must be less than ${formatFileSize(FILE_CONFIG.MAX_SIZE)}`;
  }
  return null;
};

const getErrorMessage = (error) => {
  console.error('📋 Full error object:', error);

  if (error.friendlyMessage) return error.friendlyMessage;

  if (!error.response) {
    return 'Network error or service unavailable. Please check if the backend is running.';
  }

  const data = error.response.data;

  // 1. Handle explicit detail or error message
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (data?.message) return data.message;

  // 2. Handle validation errors (nested or flat)
  if (data?.validation_errors) {
    const errors = data.validation_errors;
    return Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
      .join('\n');
  }

  // 3. Handle field-level errors at the root
  if (typeof data === 'object' && !Array.isArray(data)) {
    const errorDetails = Object.entries(data)
      .filter(([key]) => key !== 'success')
      .map(([key, value]) => {
        const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const msg = Array.isArray(value) ? value.join(', ') : value;
        return `${fieldName}: ${msg}`;
      });
    if (errorDetails.length > 0) return errorDetails.join('\n');
  }

  // 4. Fallback to status code messages
  const statusMessages = {
    400: 'Bad Request: Please check your input.',
    401: 'Unauthorized: Session expired or invalid.',
    403: 'Forbidden: You do not have permission for this action.',
    404: 'Not Found: The requested resource does not exist.',
    413: 'Payload Too Large: The file is too big.',
    500: 'Internal Server Error: Something went wrong on the server.',
  };

  return statusMessages[error.response.status] || error.message || 'An unexpected error occurred';
};

// ✅ Construct file URL with proper path handling
const getFileUrl = (fileUrl) => {
  if (!fileUrl) {
    console.error('❌ No file URL provided');
    return null;
  }

  console.log('🔗 Processing file URL:', fileUrl);

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  const backendUrl = 'http://localhost:8003';
  const cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  const mediaPath = cleanPath.startsWith('media/') ? cleanPath : `media/${cleanPath}`;
  const fullUrl = `${backendUrl}/${mediaPath}`;

  console.log('✅ Constructed full URL:', fullUrl);
  return fullUrl;
};

// ==================== STATUS BADGE COMPONENT ====================
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
};

// ==================== ERROR BANNER COMPONENT ====================
const ErrorBanner = ({ error, onDismiss, onRetry }) => {
  if (!error) return null;

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <p className="text-red-600 text-xs mt-2">
            💡 Tip: Check the browser console (F12) and backend logs for detailed error information.
          </p>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-500/10 rounded transition"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-500/10 rounded transition"
            title="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== SUCCESS BANNER COMPONENT ====================
const SuccessBanner = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-green-800 font-medium">Success</p>
          <p className="text-green-700 text-sm mt-1">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-500/10 rounded transition"
          title="Dismiss"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ==================== STATS COMPONENT ====================
const Stats = ({ documents }) => {
  const stats = [
    {
      value: documents.length,
      label: 'Total Documents',
      color: 'bg-[#1E293B] text-teal-600'
    },
    {
      value: documents.filter(d => d.indexing_status === 'completed').length,
      label: 'Ready for AI',
      color: 'bg-green-50 text-green-600'
    },
    {
      value: documents.filter(d => ['processing', 'pending'].includes(d.indexing_status)).length,
      label: 'Processing',
      color: 'bg-yellow-50 text-yellow-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className={`${stat.color.split(' ')[0]} rounded-lg p-4`}>
          <div className={`text-2xl font-bold ${stat.color.split(' ')[1]}`}>
            {stat.value}
          </div>
          <div className="text-sm text-slate-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const DocumentManagement = () => {
  const {
    documents,
    setDocuments,
    loading,
    error,
    fetchDocuments
  } = useDocumentContext();

  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localError, setLocalError] = useState(null); // Rename to avoid collision
  const [successMessage, setSuccessMessage] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  // Centralized polling is handled in DocumentContext

  // ==================== FILE SELECTION ====================
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setError(null);
  }, []);

  // ==================== FILE UPLOAD ====================
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setLocalError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name.replace(/\.[^/.]+$/, ''));
    formData.append('description', '');
    formData.append('is_public', 'false');

    console.log('📤 Uploading document:', selectedFile.name);

    try {
      const response = await documentAPI.create(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      console.log('✅ Document uploaded:', response.data);
      console.log('📊 Indexing status:', response.data.indexing_status);

      // ✅ Backend handles indexing automatically - no manual trigger needed

      setSelectedFile(null);
      setUploadProgress(0);

      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

      setSuccessMessage(
        `Document uploaded successfully! ${response.data.indexing_status === 'processing'
          ? 'AI training is in progress.'
          : 'AI training will begin shortly.'
        }`
      );
      setTimeout(() => setSuccessMessage(null), 5000);

      await fetchDocuments();

    } catch (err) {
      console.error('❌ Upload failed:', err);
      const errorMessage = getErrorMessage(err);
      if (errorMessage) setLocalError(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [selectedFile, fetchDocuments]);
  // ==================== FILE DELETION ====================
  const handleDelete = useCallback(async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await documentAPI.delete(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setSuccessMessage('Document deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('❌ Delete failed:', err);
      const errorMessage = getErrorMessage(err);
      if (errorMessage) setError(errorMessage);
    }
  }, []);

  // ==================== HANDLE VIEW DOCUMENT ====================
  const handleViewDocument = useCallback((doc) => {
    if (!doc.file || doc.file.length === 0) return;

    const fileUrl = getFileUrl(doc.file);
    const isPDF = doc.file_type?.includes('pdf');

    console.log('👁️ Viewing document:', { title: doc.title, fileType: doc.file_type, fileUrl, isPDF });

    if (isPDF) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      setViewingDocument(doc);
    }
  }, []);

  // ==================== FILTERED DOCUMENTS ====================
  const filteredDocuments = documents.filter(doc =>
    doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==================== DOCUMENT VIEWER MODAL ====================
  const DocumentViewerModal = () => {
    if (!viewingDocument) return null;

    const isPDF = viewingDocument.file_type?.includes('pdf');
    const isImage = viewingDocument.file_type?.startsWith('image/');
    const isText = viewingDocument.file_type?.includes('text') ||
      viewingDocument.file_type?.includes('csv');
    const isDoc = viewingDocument.file_type?.includes('msword') ||
      viewingDocument.file_type?.includes('wordprocessingml');

    const fileUrl = getFileUrl(viewingDocument.file);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0F172A] rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-[#0F172A] flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {viewingDocument.title || viewingDocument.file_name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
                <span>{formatFileSize(viewingDocument.file_size)}</span>
                <span>•</span>
                <span className="truncate">{viewingDocument.file_type}</span>
                <span>•</span>
                <span>{new Date(viewingDocument.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => setViewingDocument(null)}
              className="ml-4 p-2 text-slate-400 hover:text-white hover:bg-slate-100 rounded-lg transition flex-shrink-0"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden bg-[#1E293B]">
            {!fileUrl ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <AlertCircle className="w-16 h-16 text-red-300 mb-4" />
                <p className="text-slate-400 font-medium mb-2">File URL not available</p>
                <p className="text-slate-500 text-sm">Please try refreshing the page.</p>
              </div>
            ) : isImage ? (
              <div className="flex items-center justify-center h-full p-4">
                <img
                  src={fileUrl}
                  alt={viewingDocument.title || viewingDocument.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              </div>
            ) : isText ? (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <FileText className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium mb-4">Text File</p>
                <div className="flex gap-3">
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                    <ExternalLink className="w-4 h-4" /> Open in New Tab
                  </a>
                  <a href={fileUrl} download={viewingDocument.file_name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    <Download className="w-4 h-4" /> Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <FileText className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-400 font-medium mb-2">
                  {isDoc ? 'Word Document' : 'Preview not available'}
                </p>
                <p className="text-slate-500 text-sm mb-4 text-center max-w-md">
                  {isDoc
                    ? 'Word documents cannot be previewed in the browser. Please download to view.'
                    : 'This file type cannot be previewed. Please download to view.'}
                </p>
                <div className="flex gap-3">
                  <a href={fileUrl} download={viewingDocument.file_name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    <Download className="w-4 h-4" /> Download
                  </a>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">
                    <ExternalLink className="w-4 h-4" /> New Tab
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border-t bg-[#0F172A] flex-shrink-0 flex-wrap gap-3">
            <StatusBadge status={viewingDocument.indexing_status} />
            <button
              onClick={() => setViewingDocument(null)}
              className="px-4 py-2 bg-[#1E293B] text-slate-700 rounded-lg hover:bg-slate-300 transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  return (
    <>
      <DocumentViewerModal />

      <div className="max-w-6xl mx-auto">
        <div className="bg-[#0F172A] rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Document Management</h2>
            <p className="text-slate-400">Upload and manage documents to train your AI assistant</p>
          </div>

          <SuccessBanner message={successMessage} onDismiss={() => setSuccessMessage(null)} />
          <ErrorBanner error={error || localError} onDismiss={() => setLocalError(null)} onRetry={fetchDocuments} />

          {/* Upload Section */}
          <div className="bg-[#1E293B] border-2 border-dashed border-[#334155] rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept={FILE_CONFIG.ACCEPTED_EXTENSIONS}
                  disabled={uploading}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </label>

                {selectedFile && (
                  <div className="mt-2 text-sm text-slate-400">
                    Selected: <span className="font-medium">{selectedFile.name}</span>
                    <span className="ml-2">({formatFileSize(selectedFile.size)})</span>
                  </div>
                )}

                {uploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition whitespace-nowrap"
              >
                {uploading ? 'Uploading...' : 'Upload & Train'}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              Supported: PDF, DOC, DOCX, TXT, CSV (Max {formatFileSize(FILE_CONFIG.MAX_SIZE)})
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Stats */}
          <Stats documents={documents} />

          {/* Document List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-slate-400">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400">
                {searchTerm ? 'No documents found' : 'No documents uploaded yet'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Upload your first document to start training the AI
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => {
                const hasFile = doc.file && doc.file.length > 0;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-[#1E293B] rounded-lg hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <FileText className="w-10 h-10 text-teal-600 flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white truncate">
                            {doc.title || doc.file_name}
                          </p>
                          <StatusBadge status={doc.indexing_status} />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{formatFileSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => hasFile ? handleViewDocument(doc) : null}
                        disabled={!hasFile}
                        className={`p-2 rounded-lg transition ${hasFile
                          ? 'text-slate-400 hover:text-teal-600 hover:bg-[#1E293B]'
                          : 'text-slate-300 cursor-not-allowed'
                          }`}
                        title={hasFile ? 'View' : 'No file'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(doc.id, doc.title || doc.file_name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DocumentManagement;