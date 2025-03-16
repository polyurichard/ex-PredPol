"use client"

import { RoundSummary } from "@/components/round-summary"
import { useState, useEffect } from "react" 
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, RefreshCcw, Clock, SendHorizonal, CircleDollarSign, Bell } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import CityMap from "./city-map"
import ActionSelection from "./action-selection"
import OverallMetrics from "./overall-metrics"
import GameLog from "./game-log"
import GameOverview from "./game-overview"
import { DataAnalytics } from "@/components/data-analytics"

// Add district styling variables
const districtColors = {
  district1: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
  district2: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
  district3: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800",
  district4: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800",
}

const districtHeaderColors = {
  district1: "bg-blue-100 dark:bg-blue-900",
  district2: "bg-green-100 dark:bg-green-900",
  district3: "bg-amber-100 dark:bg-amber-900",
  district4: "bg-purple-100 dark:bg-purple-900",
}

// Add the missing districtEmojis object
const districtEmojis = {
  district1: "🏙️",
  district2: "🏘️",
  district3: "🏚️",
  district4: "🏫",
}

export default function GameBoard({
  currentRound,
  policeAllocation,
  setPoliceAllocation,
  gameMetrics,
  districtActions,
  setDistrictActions,
  onNextRound,
  showRoundSummary,
  roundSummary,
  closeRoundSummary,
  getDistrictName,
  gameLog,
  implementedActions,
  onRestart, 
  isFirstPlay,
}) {
  // Show the summary tab as the default tab when a new round starts
  const [activeTab, setActiveTab] = useState(showRoundSummary || (currentRound === 1 && isFirstPlay) ? "summary" : "map")
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [isRoundResultsOpen, setIsRoundResultsOpen] = useState(false)
  const [showRestartConfirmDialog, setShowRestartConfirmDialog] = useState(false);

  // Modify state for event notifications to better track unread events
  const [events, setEvents] = useState([])
  const [unreadEvents, setUnreadEvents] = useState(0)
  const [eventsOpened, setEventsOpened] = useState(false)

  // Use this effect to switch to summary tab when new round starts
  useEffect(() => {
    if (showRoundSummary) {
      setActiveTab("summary")
    }
  }, [showRoundSummary, currentRound]) // Add currentRound as a dependency

  // Extract events from roundSummary and gameLog
  useEffect(() => {
    // When a new round starts, collect special events only from the current round summary
    if (roundSummary && roundSummary.specialEvents && roundSummary.specialEvents.length > 0) {
      // Limit to at most 3 events per round
      const limitedEvents = roundSummary.specialEvents.slice(0, 3).map(event => ({
        ...event,
        round: currentRound,
        timestamp: new Date().toISOString(),
        read: false
      }))
      
      // Add to the overall events list
      setEvents(prevEvents => [...limitedEvents, ...prevEvents])
      
      // Update unread count based on new events only
      setUnreadEvents(prev => prev + limitedEvents.length)
    }
  }, [roundSummary, currentRound])

  // Reset events when game is restarted
  useEffect(() => {
    if (currentRound === 1 && isFirstPlay) {
      setEvents([])
      setUnreadEvents(0)
      setEventsOpened(false)
    }
  }, [currentRound, isFirstPlay])

  // Handle marking events as read
  const handleOpenEvents = () => {
    setEventsOpened(true)
    setUnreadEvents(0)
    setEvents(prevEvents => 
      prevEvents.map(event => ({ ...event, read: true }))
    )
  }

  const handlePoliceAllocation = (district, shift, value) => {
    const newValue = Number.parseInt(value)
    const oldValue = policeAllocation[district][shift]
    const difference = newValue - oldValue

    if (policeAllocation.unallocated - difference >= 0) {
      setPoliceAllocation({
        ...policeAllocation,
        [district]: {
          ...policeAllocation[district],
          [shift]: newValue,
        },
        unallocated: policeAllocation.unallocated - difference,
      })
    }
  }
  
  // Calculate total allocated officers (out of 20)
  const totalAllocatedOfficers = 20 - policeAllocation.unallocated;

  // Handle continue to next round
  const handleContinueToNextRound = () => {
    closeRoundSummary()
    if (currentRound <= 10) {
      setActiveTab("map") // Switch to map tab for the next round
    }
  }

  // Modify the onNextRound function to wrap it and set the active tab
  const handleNextRound = () => {
    // Set the active tab to summary before calling the original onNextRound
    setActiveTab("summary")
    onNextRound()
  }

  // Handle restart with confirmation
  const handleRestartClick = () => {
    setShowRestartConfirmDialog(true);
  }

  const handleConfirmRestart = () => {
    setShowRestartConfirmDialog(false);
    onRestart();
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden pb-4"> {/* Change from h-[90vh] to h-screen and add w-full */}
      <div className="flex justify-between items-center mb-4">
        {/* Move Round badge to the left */}
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-3 py-1 flex items-center gap-1.5">
            <Clock className="h-5 w-5" />
            Round: {currentRound}/10
          </Badge>
          
          {/* Add budget badge */}
          <Badge variant="outline" className={`text-lg px-3 py-1 flex items-center gap-1.5 ${gameMetrics.budget < 200 ? 'bg-red-50 text-red-700' : ''}`}>
            <CircleDollarSign className="h-5 w-5" />
            Budget: ${gameMetrics.budget}
          </Badge>
        </div>
        
        {/* Move buttons to the right */}
        <div className="flex items-center gap-4">
          {/* Add event notification icon with improved badge logic */}
          <Popover onOpenChange={(open) => {
            if (open) handleOpenEvents();
          }}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative mt-1" // Added top margin
              >
                <Bell className="h-5 w-5" />
                {unreadEvents > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadEvents}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-80 p-0">
              <div className="flex justify-between items-center p-3 border-b">
                <h3 className="font-medium">Events & Alerts</h3>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEvents([])
                  setUnreadEvents(0)
                }}>
                  Clear All
                </Button>
              </div>
              
              <ScrollArea className="h-[300px]">
                {events.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No events to display
                  </div>
                ) : (
                  <div className="divide-y">
                    {events.map((event, index) => (
                      <div 
                        key={index} 
                        className={`p-3 ${event.type === 'destructive' || event.type === 'negative' ? 'bg-red-50 dark:bg-red-950' : 
                                         event.type === 'positive' ? 'bg-green-50 dark:bg-green-950' : 
                                         'bg-blue-50 dark:bg-blue-950'}`}
                      >
                        <div className="flex justify-between">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge variant="outline" className="text-[10px]">Round {event.round}</Badge>
                        </div>
                        <p className="text-xs mt-1">{event.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Updated display for police allocation */}
          <Badge variant="outline" className="text-lg px-3 py-1">
            Allocated Police: {totalAllocatedOfficers}/20 👮
          </Badge>
          
          {/* Help button */}
          <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <InfoIcon className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Simulation Help</DialogTitle>
                <DialogDescription>Understanding metrics and game mechanics</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-lg font-medium">Key Metrics</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>
                      <strong>Community Trust:</strong> Represents how much the community trusts the police. Higher
                      trust leads to better cooperation and crime reporting.
                    </li>
                    <li>
                      <strong>Crime Rate:</strong> The percentage of criminal activity in a district. Lower is better.
                    </li>
                    <li>
                      <strong>Arrests by Race/Income:</strong> Shows the distribution of arrests across different
                      demographic groups. Disparities may indicate bias.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium">Game Mechanics</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>
                      <strong>Police Allocation:</strong> You have 20 officers to distribute across 4 districts and 2
                      shifts. Each district must have at least 1 officer per shift.
                    </li>
                    <li>
                      <strong>Actions:</strong> Each round, you can implement ONE action in ONE district. Choose
                      carefully based on district needs.
                    </li>
                    <li>
                      <strong>Round Summary:</strong> After each round, you'll see how your decisions affected the
                      metrics in each district.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium">District Profiles</h3>
                  <ul className="list-disc pl-6 mt-2 space-y-2">
                    <li>
                      <strong>Downtown (District 1):</strong> High income, primarily white population, low crime rate,
                      high trust in police
                    </li>
                    <li>
                      <strong>Westside (District 2):</strong> Mixed income, diverse population, moderate crime rate,
                      moderate trust
                    </li>
                    <li>
                      <strong>South Side (District 3):</strong> Low income, primarily minority population, high crime
                      rate, low trust
                    </li>
                    <li>
                      <strong>Eastside (District 4):</strong> Mixed demographic with historical tensions with police
                    </li>
                  </ul>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Add restart button */}
          <Button variant="outline" onClick={handleRestartClick} className="flex items-center gap-1.5">
            <RefreshCcw className="h-4 w-4" />
            Restart
          </Button>
          
          {/* End Round button with a sharper color */}
          <Button onClick={handleNextRound} className="flex items-center gap-1.5" variant="default">
            <SendHorizonal className="h-4 w-4" />
            End Round
          </Button>
        </div>
      </div>

      <OverallMetrics gameMetrics={gameMetrics} currentRound={currentRound} />

      {/* Replace Tabs with Sidebar + Content layout */}
      <div className="flex flex-1 mt-2 gap-4 overflow-hidden"> {/* Reduced mt-4 to mt-2 to save space */}
        {/* Left Sidebar Menu with updated selection styling and sharper colors */}
        <div className="w-48 bg-muted/30 rounded-md border p-2 flex flex-col gap-1"> {/* Reduce width from 56 to 48 */}
          <Button 
            variant={activeTab === "summary" ? "secondary" : "ghost"} 
            className={`justify-start ${activeTab === "summary" ? "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700" : ""}`}
            onClick={() => setActiveTab("summary")}
          >
            <span className="mr-2">{currentRound === 1 && isFirstPlay ? "📋" : "📊"}</span>
            {currentRound === 1 && isFirstPlay ? "Game Overview" : "Round Summary"}
          </Button>
          <Button 
            variant={activeTab === "map" ? "secondary" : "ghost"} 
            className={`justify-start ${activeTab === "map" ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            <span className="mr-2">🗺️</span>
            Districts
          </Button>
          <Button 
            variant={activeTab === "actions" ? "secondary" : "ghost"} 
            className={`justify-start ${activeTab === "actions" ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700" : ""}`}
            onClick={() => setActiveTab("actions")}
          >
            <span className="mr-2">⚙️</span>
            Actions
          </Button>
          <Button 
            variant={activeTab === "performance" ? "secondary" : "ghost"} 
            className={`justify-start ${activeTab === "performance" ? "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800 dark:text-purple-100 dark:hover:bg-purple-700" : ""}`}
            onClick={() => setActiveTab("performance")}
          >
            <span className="mr-2">📈</span>
            Data Analytics
          </Button>
          <Button 
            variant={activeTab === "log" ? "secondary" : "ghost"} 
            className={`justify-start ${activeTab === "log" ? "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-800 dark:text-rose-100 dark:hover:bg-rose-700" : ""}`}
            onClick={() => setActiveTab("log")}
          >
            <span className="mr-2">📜</span>
            Round History
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-background border rounded-md overflow-hidden">
          {/* Round Summary Tab Content */}
          {activeTab === "summary" && (
            <div className="h-full overflow-auto">
              {currentRound === 1 && isFirstPlay ? (
                <div className="p-4 space-y-4">
                  <GameOverview isEmbedded={true} onStart={() => setActiveTab("map")} />
                </div>
              ) : (
                <RoundSummary
                  currentRound={currentRound}
                  gameMetrics={gameMetrics}
                  policeAllocation={policeAllocation}
                  roundSummary={roundSummary}
                  getDistrictName={getDistrictName}
                />
              )}
            </div>
          )}

          {/* Map Tab Content */}
          {activeTab === "map" && (
            <div className="h-full overflow-auto">
              <CityMap
                policeAllocation={policeAllocation}
                handlePoliceAllocation={handlePoliceAllocation}
                gameMetrics={gameMetrics}
                getDistrictName={getDistrictName}
              />
            </div>
          )}

          {/* Actions Tab Content */}
          {activeTab === "actions" && (
            <div className="h-full overflow-auto">
              <ActionSelection
                districtActions={districtActions}
                setDistrictActions={setDistrictActions}
                getDistrictName={getDistrictName}
                currentRound={currentRound}
                gameMetrics={gameMetrics}
                implementedActions={implementedActions}
              />
            </div>
          )}

          {/* Performance Tab Content */}
          {activeTab === "performance" && (
            <div className="h-full overflow-auto">
              <DataAnalytics 
                gameLog={gameLog} 
                getDistrictName={getDistrictName} 
                currentRound={currentRound}
              />
            </div>
          )}

          {/* Game Log Tab Content */}
          {activeTab === "log" && (
            <div className="h-full overflow-auto">
              <GameLog gameLog={gameLog} getDistrictName={getDistrictName} currentRound={currentRound} />
            </div>
          )}
        </div>
      </div>
      
      {/* Restart confirmation dialog */}
      <AlertDialog open={showRestartConfirmDialog} onOpenChange={setShowRestartConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the simulation to Round 1 and all your progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowRestartConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRestart} className="flex items-center gap-1.5">
              <RefreshCcw className="h-4 w-4" />
              Restart
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

