import { useState } from 'react'
import axios from 'axios'

const API_URL = 'https://complaint-analyzer-backend11-o8ru.onrender.com'
function ComplaintForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    text: '',
    customer_name: '',
    customer_email: ''
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('📤 Sending request...')
      
      const response = await axios.post(
        `${API_URL}/api/complaints`, 
        formData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        }
      )

      console.log('✅ Response:', response.data)
      
      if (response.status === 200 || response.status === 201) {
        const data = response.data?.data || response.data
        
        if (data && (data.category || data.sentiment)) {
          setResult(data)
          setFormData({ text: '', customer_name: '', customer_email: '' })
          // ✅ NO AUTO-REDIRECT - User stays on page
        } else {
          setResult({
            category: 'Unknown',
            sentiment: 'NEUTRAL',
            priority: 'Medium',
            category_confidence: 0.5,
            sentiment_score: 0.5,
            priority_score: 2,
          })
        }
      }
      
    } catch (err) {
      console.error('❌ Error:', err)
      
      let errorMessage = 'An unexpected error occurred'
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check "All Records" tab - your complaint may have been saved.'
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to backend. Please ensure backend is running on http://localhost:8000'
      } else if (err.response) {
        errorMessage = err.response.data?.detail || `Server error: ${err.response.status}`
      } else if (err.request) {
        errorMessage = 'No response from server.'
      } else {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-700 border-red-300'
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-300'
      case 'Low': return 'bg-green-50 text-green-700 border-green-300'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const getSentimentColor = (sentiment) => {
    return sentiment === 'NEGATIVE' 
      ? 'bg-red-50 text-red-700 border-red-300' 
      : 'bg-green-50 text-green-700 border-green-300'
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Submit Customer Complaint</h2>
        <p className="text-gray-600 mt-1">Enter complaint details for AI-powered analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter customer name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Email
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="customer@example.com"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Complaint Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({...formData, text: e.target.value})}
            required
            rows={6}
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Describe the complaint in detail..."
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Minimum 10 characters required</p>
            <p className="text-xs text-gray-500">{formData.text.length} characters</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || formData.text.length < 10}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Processing... (15-30 seconds)
            </span>
          ) : (
            ' Analyze Complaint'
          )}
        </button>

        {loading && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <svg className="animate-spin h-5 w-5 text-blue-600 mr-3 mt-0.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900">🤖 AI Analysis in Progress</p>
                <p className="text-xs text-blue-700 mt-1">
                  Analyzing complaint with NLP models... This may take 15-30 seconds.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-bold mb-2">⚠️ Analysis Failed</p>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setError(null)}
                  className="text-sm bg-red-200 hover:bg-red-300 text-red-800 px-4 py-2 rounded font-medium"
                >
                  ✕ Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 rounded-xl shadow-xl">
          <div className="flex items-center mb-6">
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mr-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                ✅ Analysis Complete!
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Complaint has been analyzed and saved successfully
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">📂 Category</p>
              <p className="text-lg font-bold text-blue-600 mb-2">{result.category}</p>
              {result.category_confidence && (
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{width: `${result.category_confidence * 100}%`}}
                    ></div>
                  </div>
                  <span className="font-semibold">{(result.category_confidence * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">😊 Sentiment</p>
              <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getSentimentColor(result.sentiment)}`}>
                {result.sentiment === 'NEGATIVE' ? '😞 NEGATIVE' : '😊 POSITIVE'}
              </div>
              {result.sentiment_score && (
                <p className="text-xs text-gray-600 mt-2">
                  Score: {(result.sentiment_score * 100).toFixed(0)}%
                </p>
              )}
            </div>

            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">⚡ Priority</p>
              <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getPriorityColor(result.priority)}`}>
                🔥 {result.priority.toUpperCase()}
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">📊 Urgency</p>
              <p className="text-4xl font-bold text-gray-900">
                {result.priority_score}<span className="text-xl text-gray-500">/5</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border-2 border-blue-300 rounded-lg mb-6">
            <p className="text-sm text-gray-700 flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <span>
                <strong>📌 Recommended Action:</strong><br />
                Forward to <strong className="text-blue-700">{result.category}</strong> department for resolution.
              </span>
            </p>
          </div>

          {/* ✅ NEW: Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                if (onSuccess) onSuccess()
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              View All Records
            </button>
            <button
              onClick={() => {
                setResult(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Submit Another Complaint
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintForm