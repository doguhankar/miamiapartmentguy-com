"use client"

import { useState } from "react"
import { X, CheckCircle2, AlertCircle, XCircle, MessageCircle } from "lucide-react"
import { Building } from "@/lib/buildings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface QualifyModalProps {
  building: Building
  onClose: () => void
}

type QualificationResult = "qualify" | "close" | "not-fit" | null

export function QualifyModal({ building, onClose }: QualifyModalProps) {
  const [income, setIncome] = useState("")
  const [creditScore, setCreditScore] = useState("")
  const [moveInDate, setMoveInDate] = useState("")
  const [result, setResult] = useState<QualificationResult>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const monthlyIncome = parseFloat(income)
    const credit = parseInt(creditScore)

    const incomeThreshold = building.incomeRequirement * 0.9
    const creditThreshold = building.creditRequirement * 0.9

    if (monthlyIncome >= building.incomeRequirement && credit >= building.creditRequirement) {
      setResult("qualify")
    } else if (monthlyIncome >= incomeThreshold && credit >= creditThreshold) {
      setResult("close")
    } else {
      setResult("not-fit")
    }
  }

  const resetForm = () => {
    setResult(null)
    setIncome("")
    setCreditScore("")
    setMoveInDate("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {!result ? (
          <>
            <h2 className="mb-1 text-xl font-semibold text-foreground">
              Check Your Eligibility
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              for {building.name} in {building.neighborhood}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income">Monthly Income</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="income"
                    type="number"
                    placeholder="5,000"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit">Credit Score</Label>
                <Input
                  id="credit"
                  type="number"
                  placeholder="700"
                  min="300"
                  max="850"
                  value={creditScore}
                  onChange={(e) => setCreditScore(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moveIn">Desired Move-in Date</Label>
                <Input
                  id="moveIn"
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0066CC] text-white hover:bg-[#0055AA]"
                size="lg"
              >
                Check Eligibility
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            {result === "qualify" && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-emerald-600">
                  You Qualify!
                </h3>
                <p className="mb-6 text-muted-foreground">
                  Great news! Based on the information you provided, you meet the
                  requirements for {building.name}.
                </p>
              </>
            )}

            {result === "close" && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-amber-600">
                  You&apos;re Close!
                </h3>
                <p className="mb-6 text-muted-foreground">
                  You&apos;re nearly there! Let&apos;s chat about options that might work for
                  your situation at {building.name}.
                </p>
              </>
            )}

            {result === "not-fit" && (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <XCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Not Quite a Match
                </h3>
                <p className="mb-6 text-muted-foreground">
                  This property might not be the best fit right now, but we have other
                  options that could work for you!
                </p>
              </>
            )}

            <div className="space-y-3">
              <a
                href="sms:+13055551234"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066CC] px-4 py-3 font-medium text-white hover:bg-[#0055AA]"
              >
                <MessageCircle className="h-4 w-4" />
                Text Us With Questions
              </a>
              <Button variant="outline" onClick={resetForm} className="w-full">
                Check Again
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Back to Map
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
