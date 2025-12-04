import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
// Optimized icon imports - only import used icons to reduce bundle size
import { 
  Zap, 
  TrendingUp, 
  Activity, 
  Cpu 
} from 'lucide-react'
import { getDailyUsageHistory, getUnifiedGenerationStats } from '../utils/usageTracking'
import { useAuth } from '../auth/AuthContext.jsx'

function StatsCards() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    today: { generations: 0, time: 0, tokens: 0 },
    week: { generations: 0, time: 0, tokens: 0 },
    month: { generations: 0, time: 0, tokens: 0 },
    total: { generations: 0, time: 0, tokens: 0 }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.username) {
      loadUsageStats()
    }
  }, [user])

  const loadUsageStats = async () => {
    try {
      console.log('🔄 Loading unified generation stats with real tokens...')
      console.log('User object:', user)
      console.log('User ID for query:', user.id)
      const { success, data } = await getUnifiedGenerationStats(user.id, 90)
      
      if (success && data) {
        console.log('📊 Unified stats loaded:', data.length, 'days of data')
        console.log('Sample day data:', data[0])
        
        const today = new Date().toISOString().split('T')[0]
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const todayStats = data.find(d => d.usage_date === today) || { 
          generations_count: 0, 
          generation_time_seconds: 0, 
          total_tokens: 0 
        }
        const weekStats = data.filter(d => d.usage_date >= weekAgo)
        const monthStats = data.filter(d => d.usage_date >= monthAgo)

        const weekTotals = weekStats.reduce((acc, curr) => ({
          generations: acc.generations + (curr.generations_count || 0),
          time: acc.time + (curr.generation_time_seconds || 0),
          tokens: acc.tokens + (curr.total_tokens || 0)
        }), { generations: 0, time: 0, tokens: 0 })

        const monthTotals = monthStats.reduce((acc, curr) => ({
          generations: acc.generations + (curr.generations_count || 0),
          time: acc.time + (curr.generation_time_seconds || 0),
          tokens: acc.tokens + (curr.total_tokens || 0)
        }), { generations: 0, time: 0, tokens: 0 })

        console.log('📈 Stats calculated:', {
          today: {
            generations: todayStats.generations_count || 0,
            time: todayStats.generation_time_seconds || 0,
            tokens: todayStats.total_tokens || 0
          },
          week: weekTotals,
          month: monthTotals
        })

        setStats({
          today: {
            generations: todayStats.generations_count || 0,
            time: todayStats.generation_time_seconds || 0,
            tokens: todayStats.total_tokens || 0
          },
          week: weekTotals,
          month: monthTotals,
          total: monthTotals // For now, using month as total
        })
      } else {
        console.log('❌ Failed to load unified stats, trying fallback...')
        // Fallback to materialized view daily_usage_history if unified stats fail
        const { success: fallbackSuccess, data: fallbackData } = await getDailyUsageHistory(user.id, 30)
        if (fallbackSuccess && fallbackData?.length > 0) {
          console.log('📊 Fallback data loaded:', fallbackData.length, 'records')
          
          const today = new Date().toISOString().split('T')[0]
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          
          const todayStats = fallbackData.find(d => d.usage_date === today) || { 
            generations_count: 0, 
            generation_time_seconds: 0, 
            prompt_tokens: 0,
            output_tokens: 0
          }
          
          const weekStats = fallbackData.filter(d => d.usage_date >= weekAgo)
          const weekTotals = weekStats.reduce((acc, curr) => ({
            generations: acc.generations + (curr.generations_count || 0),
            time: acc.time + (curr.generation_time_seconds || 0),
            tokens: acc.tokens + (curr.prompt_tokens || 0) + (curr.output_tokens || 0)
          }), { generations: 0, time: 0, tokens: 0 })
          
          const monthTotals = fallbackData.reduce((acc, curr) => ({
            generations: acc.generations + (curr.generations_count || 0),
            time: acc.time + (curr.generation_time_seconds || 0),
            tokens: acc.tokens + (curr.prompt_tokens || 0) + (curr.output_tokens || 0)
          }), { generations: 0, time: 0, tokens: 0 })
          
          setStats({
            today: {
              generations: todayStats.generations_count || 0,
              time: todayStats.generation_time_seconds || 0,
              tokens: (todayStats.prompt_tokens || 0) + (todayStats.output_tokens || 0)
            },
            week: weekTotals,
            month: monthTotals,
            total: monthTotals
          })
        }
      }
    } catch (error) {
      console.error('Error loading usage stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0s'
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`
    return `${Math.round(seconds / 3600)}h`
  }

  const formatTokens = (tokens) => {
    if (!tokens) return '0'
    if (tokens < 1000) return tokens.toString()
    if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`
    return `${(tokens / 1000000).toFixed(1)}M`
  }

  const statsConfig = [
    {
      title: 'Heute',
      description: 'Heute generiert',
      icon: Activity,
      value: stats.today.generations,
      subtitle: `${formatTime(stats.today.time)} Laufzeit`,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      trend: '+12%'
    },
    {
      title: 'Diese Woche',
      description: '7 Tage Aktivität',
      icon: TrendingUp,
      value: stats.week.generations,
      subtitle: `${formatTime(stats.week.time)} gesamt`,
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100 text-green-600',
      trend: '+5%'
    },
    {
      title: 'Token (Monat)',
      description: 'Gemini API Tokens',
      icon: Cpu,
      value: formatTokens(stats.month.tokens),
      subtitle: `${stats.month.tokens} gesamt`,
      gradient: 'from-indigo-500 to-indigo-600',
      iconBg: 'bg-indigo-100 text-indigo-600',
      trend: '+22%'
    },
    {
      title: 'Effizienz',
      description: 'Durchschnittliche Zeit',
      icon: Zap,
      value: stats.month.generations > 0 ? Math.round(stats.month.time / stats.month.generations) : 0,
      subtitle: 'Sekunden pro Bild',
      gradient: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100 text-orange-600',
      trend: '-8%'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1,2,3,4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="group relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                  {stat.value}
                </p>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default StatsCards