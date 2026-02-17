'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek
} from 'date-fns'
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'

type CalendarEvent = {
  id: string
  type: 'social'
  platform?: string
  status?: string
  hook?: string
  post?: string
  scheduledTime: string
}

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const platformBadge = (platform?: string) => {
  const value = (platform || '').toLowerCase()
  if (value.includes('facebook')) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (value.includes('instagram')) return 'bg-pink-50 text-pink-700 border-pink-200'
  if (value.includes('x') || value.includes('twitter')) return 'bg-slate-50 text-slate-700 border-slate-200'
  if (value.includes('linkedin')) return 'bg-cyan-50 text-cyan-700 border-cyan-200'
  if (value.includes('tiktok')) return 'bg-gray-50 text-gray-800 border-gray-200'
  if (value.includes('youtube')) return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

const statusBadge = (status?: string) => {
  const value = (status || '').toLowerCase()
  if (value.includes('approved')) return 'bg-green-50 text-green-700 border-green-200'
  if (value.includes('published')) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (value.includes('scheduled')) return 'bg-blue-50 text-blue-700 border-blue-200'
  if (value.includes('in review')) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

const formatTimeJohannesburg = (isoDate: string) =>
  new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(isoDate))

interface CalendarViewProps {
  clientId?: string
  embedded?: boolean
}

export function CalendarView({ clientId: clientIdProp, embedded = false }: CalendarViewProps) {
  const params = useParams()
  const clientId = clientIdProp || ((params?.clientId as string) || '')

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movingEvents, setMovingEvents] = useState<Record<string, boolean>>({})
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  )

  useEffect(() => {
    if (!clientId) return
    const fetchEvents = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/calendar/${clientId}`)
        if (!response.ok) {
          throw new Error('Failed to load calendar data')
        }
        const data = await response.json()
        setEvents(data.events || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [clientId])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesPlatform = platformFilter === 'all' || (event.platform || '').toLowerCase() === platformFilter
      const matchesStatus = statusFilter === 'all' || (event.status || '').toLowerCase() === statusFilter
      return matchesPlatform && matchesStatus
    })
  }, [events, platformFilter, statusFilter])

  const daysInView = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })

    const days: Date[] = []
    let day = start
    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  const platforms = useMemo(() => {
    const values = Array.from(
      new Set(events.map((e) => (e.platform || '').toLowerCase()).filter(Boolean))
    )
    return values
  }, [events])

  const statuses = useMemo(() => {
    const values = Array.from(
      new Set(events.map((e) => (e.status || '').toLowerCase()).filter(Boolean))
    )
    return values
  }, [events])

  const eventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => {
      try {
        const eventDate = parseISO(event.scheduledTime)
        return isSameDay(eventDate, day)
      } catch {
        return false
      }
    })
  }

  const gotoPreviousMonth = () => {
    const previous = addDays(startOfMonth(currentMonth), -1)
    setCurrentMonth(startOfMonth(previous))
  }

  const gotoNextMonth = () => {
    const next = addDays(endOfMonth(currentMonth), 1)
    setCurrentMonth(startOfMonth(next))
  }

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over) return

    const eventId =
      (active.data?.current as any)?.eventId?.toString() ||
      active.id.toString().replace('event-', '')
    const targetDate =
      (over.data?.current as any)?.date ||
      (typeof over.id === 'string' && over.id.startsWith('day-')
        ? over.id.replace('day-', '')
        : null)

    if (!eventId || !targetDate) return

    const targetEvents = events
    const original = targetEvents.find((e) => e.id === eventId)
    if (!original) return

    const originalDate = new Date(original.scheduledTime)
    const newDate = new Date(targetDate)
    newDate.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds(),
      originalDate.getMilliseconds()
    )
    const newIso = newDate.toISOString()

    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, scheduledTime: newIso } : e))
    )
    setMovingEvents((prev) => ({ ...prev, [eventId]: true }))

    try {
      const res = await fetch(`/api/baserow/${clientId}/social-media-content/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime: newIso })
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to update scheduled time')
      }
    } catch (err) {
      console.error('Failed to reschedule post', err)
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, scheduledTime: original.scheduledTime } : e))
      )
    } finally {
      setMovingEvents((prev) => {
        const copy = { ...prev }
        delete copy[eventId]
        return copy
      })
    }
  }

  const DraggableEvent = ({ event }: { event: CalendarEvent }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `event-${event.id}`,
      data: { eventId: event.id }
    })

    const style = {
      transform: transform ? CSS.Translate.toString(transform) : undefined,
      opacity: isDragging ? 0.7 : 1,
      cursor: 'grab'
    }

    const isMoving = movingEvents[event.id]

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="rounded-md border border-gray-200 bg-gray-50 p-2 shadow-sm active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={statusBadge(event.status)}>
            {isMoving ? 'Moving...' : event.status || 'Status'}
          </Badge>
          <Badge variant="outline" className={platformBadge(event.platform)}>
            {event.platform || 'Platform'}
          </Badge>
          <span className="text-[11px] text-gray-600">{formatTimeJohannesburg(event.scheduledTime)}</span>
        </div>
        <p className="mt-1 text-xs text-gray-800 line-clamp-2">
          {event.hook || event.post || 'Untitled post'}
        </p>
      </div>
    )
  }

  const DroppableDay = ({ day }: { day: Date }) => {
    const dayId = format(day, 'yyyy-MM-dd')
    const { setNodeRef, isOver } = useDroppable({
      id: `day-${dayId}`,
      data: { date: dayId }
    })

    const dayEvents = eventsForDay(day)
    const isToday = isSameDay(day, new Date())
    const inMonth = isSameMonth(day, currentMonth)

    return (
      <div
        ref={setNodeRef}
        className={`min-h-[140px] bg-white p-2 flex flex-col gap-2 transition-colors ${
          !inMonth ? 'bg-gray-50 text-gray-400' : ''
        } ${isOver ? 'ring-2 ring-blue-200' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${isToday ? 'text-blue-600' : ''}`}>
            {format(day, 'd')}
          </span>
          {isToday && (
            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : dayEvents.length === 0 ? (
          <p className="text-[11px] text-gray-400">No posts</p>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEvents.map((event) => (
              <DraggableEvent key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const containerClass = embedded
    ? 'w-full space-y-4'
    : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6'

  return (
    <div className={`${containerClass} min-h-[70vh]`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500">Scheduled social posts (Africa/Johannesburg)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={gotoPreviousMonth} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center px-3 text-sm font-medium text-gray-700">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <Button variant="outline" size="icon" onClick={gotoNextMonth} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base text-gray-800">Filters</CardTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Platform</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden lg:block">
              <p className="text-xs text-gray-500">
                Drag posts onto a day to reschedule. More content types can be added later.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 px-1">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-center py-2">
                {label}
              </div>
            ))}
          </div>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-7 gap-px rounded-lg bg-gray-200 overflow-hidden">
              {daysInView.map((day) => (
                <DroppableDay key={day.toISOString()} day={day} />
              ))}
            </div>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}

export default CalendarView

