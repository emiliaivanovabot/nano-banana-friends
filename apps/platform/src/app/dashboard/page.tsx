'use client'

import { useAuth } from '@repo/auth-config'
import { getDailyUsageHistory } from '@repo/business-logic'
import { getPlatformUrl, getGeminiUrl, getSeedreamUrl } from '@repo/constants'
import { Button } from '@repo/ui'
import { Settings, LogOut, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface DashboardStats {
  today: {
    images: number
    time: number
    tokens: number
    cost: number
    count_1k: number
    count_2k: number
    count_4k: number
  }
  week: {
    images: number
    time: number
    tokens: number
    cost: number
    count_1k: number
    count_2k: number
    count_4k: number
  }
  month: {
    cost: number
  }
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    today: { images: 0, time: 0, tokens: 0, cost: 0, count_1k: 0, count_2k: 0, count_4k: 0 },
    week: { images: 0, time: 0, tokens: 0, cost: 0, count_1k: 0, count_2k: 0, count_4k: 0 },
    month: { cost: 0 }
  })

  const loadStats = async () => {
    if (user?.id) {
      try {
        console.log('📊 Loading dashboard stats for user:', user.id)
        
        const usageData = await getDailyUsageHistory(user.id, 30)
        if (usageData.success) {
          const today = new Date().toISOString().split('T')[0]
          const todayData = usageData.data.find(d => d.usage_date === today)
          
          // Calculate weekly stats
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - 7)
          const weekData = usageData.data.filter(d => 
            new Date(d.usage_date) >= weekStart
          )
          
          const weekStats = weekData.reduce((acc, day) => ({
            images: acc.images + (day.generations_count || 0),
            time: acc.time + (day.generation_time_seconds || 0),
            tokens: acc.tokens + (day.prompt_tokens || 0) + (day.output_tokens || 0),
            cost: acc.cost + (parseFloat(day.cost_usd.toString()) || 0),
            count_1k: acc.count_1k + (day.count_1k || 0),
            count_2k: acc.count_2k + (day.count_2k || 0),
            count_4k: acc.count_4k + (day.count_4k || 0)
          }), { images: 0, time: 0, tokens: 0, cost: 0, count_1k: 0, count_2k: 0, count_4k: 0 })
          
          // Calculate monthly cost  
          const monthCost = usageData.data.reduce((acc, day) => 
            acc + (parseFloat(day.cost_usd.toString()) || 0), 0
          )

          setStats({
            today: {
              images: todayData?.generations_count || 0,
              time: Math.round((todayData?.generation_time_seconds || 0) / 60),
              tokens: Math.round(((todayData?.prompt_tokens || 0) + (todayData?.output_tokens || 0)) / 1000),
              cost: (parseFloat(todayData?.cost_usd?.toString() || '0') || 0) * 1.1,
              count_1k: todayData?.count_1k || 0,
              count_2k: todayData?.count_2k || 0,
              count_4k: todayData?.count_4k || 0
            },
            week: {
              images: weekStats.images,
              time: Math.round(weekStats.time / 60),
              tokens: Math.round(weekStats.tokens / 1000),
              cost: weekStats.cost * 1.1,
              count_1k: weekStats.count_1k,
              count_2k: weekStats.count_2k,
              count_4k: weekStats.count_4k
            },
            month: {
              cost: monthCost * 1.1
            }
          })
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }
  }

  useEffect(() => {
    loadStats()
  }, [user])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const getFirstName = (username?: string) => {
    if (!username) return 'User'
    const firstName = username.split('.')[0] || username
    return firstName.charAt(0).toUpperCase() + firstName.slice(1)
  }

  const navigateToApp = (url: string) => {
    window.open(url, '_blank')
  }

  const tools = [
    {
      id: 'nano-banana',
      title: 'Nano Banana Pro',
      subtitle: 'AI Image Generator',
      url: getGeminiUrl(),
      gradient: 'from-yellow-500 to-orange-500',
      icon: '🍌'
    },
    {
      id: 'seedream',
      title: 'Seedream 4.5 Pro',
      subtitle: 'High-Fidelity Images',
      url: getSeedreamUrl(),
      gradient: 'from-purple-500 to-blue-500',
      icon: '🌟'
    }
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-muted-foreground mb-2">
                neuronalworks
              </h1>
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Hallo {getFirstName(user?.username)}! 🍌
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Wähle dein AI Tool und ab gehts
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2"
              >
                <Settings size={16} />
                Einstellungen
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2"
              >
                <LogOut size={16} />
                {isLoggingOut ? 'Abmeldung...' : 'Abmelden'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Heute</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Bilder:</span>
                <span className="font-semibold text-primary">{stats.today.images}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Zeit:</span>
                <span className="font-semibold">{stats.today.time} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Kosten:</span>
                <span className="font-semibold text-destructive">€{stats.today.cost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Diese Woche</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Bilder:</span>
                <span className="font-semibold text-primary">{stats.week.images}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Zeit:</span>
                <span className="font-semibold">{stats.week.time} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Kosten:</span>
                <span className="font-semibold text-destructive">€{stats.week.cost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Dieser Monat</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Deine Ausgaben</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  €{stats.month.cost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => navigateToApp(tool.url)}
              className="group bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all duration-200 text-left relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">
                      {tool.title}
                    </h3>
                    <p className="text-primary font-semibold">
                      {tool.subtitle}
                    </p>
                  </div>
                  <div className="text-4xl">
                    {tool.icon}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="text-sm">Tool öffnen</span>
                  <ExternalLink size={14} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}