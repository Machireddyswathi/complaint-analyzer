import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://complaint-analyzer-backend11-o8ru.onrender.com'

function Dashboard({ refreshTrigger }) {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchComplaints()
  }, [refreshTrigger])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/complaints`)
      setComplaints(response.data.data)
    } catch (error) {
      console.error('Failed to fetch complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      'High': 'bg-red-600 text-white',
      'Medium': 'bg-yellow-600 text-white',
      'Low': 'bg-green-600 text-white'
    }
    return colors[priority] || 'bg-gray-500 text-white'
  }

  const getSentimentBadge = (sentiment) => {
    return sentiment === 'NEGATIVE' 
      ? 'bg-red-100 text-red-800 border border-red-300' 
      : 'bg-green-100 text-green-800 border border-green-300'
  }
  const formatDate = (timestamp) => {
  try {
    const date = new Date(timestamp)
    
    // Format for Indian locale
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST'
  } catch (e) {
    return 'Invalid date'
  }
}
  const filteredComplaints = complaints.filter(c => {
    if (filter === 'all') return true
    if (filter === 'high') return c.priority === 'High'
    if (filter === 'medium') return c.priority === 'Medium'
    if (filter === 'low') return c.priority === 'Low'
    return true
  })

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4 font-medium">Loading records...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Complaint Records</h2>
          <p className="text-gray-600 mt-1">{filteredComplaints.length} complaint(s) found</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {['all', 'high', 'medium', 'low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg font-medium">No complaints found</p>
          <p className="text-gray-400 text-sm mt-2">Submit your first complaint to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <div
              key={complaint._id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex flex-wrap justify-between items-start mb-4 gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getPriorityBadge(complaint.priority)}`}>
                    {complaint.priority.toUpperCase()}
                  </span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${getSentimentBadge(complaint.sentiment)}`}>
                    {complaint.sentiment}
                  </span>
                  <span className="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-300">
                    {complaint.category}
                  </span>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                  </svg>
                  {formatDate(complaint.timestamp)}
                </div>
              </div>

              <p className="text-gray-800 mb-4 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                {complaint.original_text}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Confidence</p>
                  <p className="text-sm font-bold text-gray-900">
                    {(complaint.category_confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Sentiment Score</p>
                  <p className="text-sm font-bold text-gray-900">
                    {(complaint.sentiment_score * 100).toFixed(0)}%
                  </p>
                </div>
                {complaint.customer_name && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {complaint.customer_name}
                    </p>
                  </div>
                )}
                {complaint.customer_email && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                    <a 
                      href={`mailto:${complaint.customer_email}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                      title="Click to send email"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      <span className="truncate max-w-[150px]">{complaint.customer_email}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard