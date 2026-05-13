"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Building } from "@/lib/buildings"
import { Button } from "@/components/ui/button"

interface QualifyModalProps {
  building: Building
  onClose: () => void
}

export function QualifyModal({ building, onClose }: QualifyModalProps) {
  const [step, setStep] = useState<"form" | "results" | "contact">("form")
  const [formData, setFormData] = useState({
    income: "",
    credit: "",
    moveInDate: "",
    firstName: "",
    phone: "",
  })
  const [result, setResult] = useState<"qualify" | "close" | "not-fit" | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const income = parseInt(formData.income)
    const credit = parseInt(formData.credit)
    const incomeMultiplier = parseInt(building.incomeReq)
    const creditReq = parseInt(building.creditReq.replace(">", ""))

    let status: "qualify" | "close" | "not-fit" = "qualify"
    if (income < incomeMultiplier * 1500) status = "not-fit"
    else if (income < incomeMultiplier * 2000) status = "close"

    if (credit < creditReq) status = "not-fit"

    setResult(status)
    setStep("results")
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const leadData = {
      buildingName: building.name,
      income: parseInt(formData.income),
      creditScore: parseInt(formData.credit),
      moveInDate: formData.moveInDate,
      qualificationStatus: result,
      firstName: formData.firstName,
      phone: formData.phone,
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Lead captured:", leadData)
    setStep("contact")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
        {step === "form" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">{building.name}</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Monthly Income
                </label>
                <input
                  type="number"
                  required
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Credit Score
                </label>
                <input
                  type="number"
                  required
                  value={formData.credit}
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., 680"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Move-In Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0066CC] text-white hover:bg-[#0055AA] py-2 rounded-lg font-semibold"
              >
                Get My Results
              </Button>
            </form>

            <button
              onClick={onClose}
              className="mt-4 w-full text-muted-foreground hover:text-foreground py-2"
            >
              Close
            </button>
          </>
        )}

        {step === "results" && (
          <>
            <div className="text-center mb-6">
              {result === "qualify" && (
                <>
                  <div className="text-5xl mb-3">✓</div>
                  <h2 className="text-3xl font-bold text-green-600">You Qualify!</h2>
                  <p className="text-muted-foreground mt-2">
                    Great news — you meet the requirements for {building.name}
                  </p>
                </>
              )}
              {result === "close" && (
                <>
                  <div className="text-5xl mb-3">⚠</div>
                  <h2 className="text-3xl font-bold text-yellow-600">You&apos;re Close</h2>
                  <p className="text-muted-foreground mt-2">
                    You&apos;re close on income. Let&apos;s talk about your options
                  </p>
                </>
              )}
              {result === "not-fit" && (
                <>
                  <div className="text-5xl mb-3">✗</div>
                  <h2 className="text-3xl font-bold text-red-600">Not a Fit</h2>
                  <p className="text-muted-foreground mt-2">
                    This building may not be the right fit right now. We have other options
                  </p>
                </>
              )}
            </div>

            <Button
              onClick={() => setStep("contact")}
              className="w-full bg-[#0066CC] text-white hover:bg-[#0055AA] py-2 rounded-lg font-semibold mb-3"
            >
              Continue
            </Button>

            <button
              onClick={onClose}
              className="w-full text-muted-foreground hover:text-foreground py-2"
            >
              Back
            </button>
          </>
        )}

        {step === "contact" && !result && (
          <>
            <h2 className="text-2xl font-bold mb-2 text-foreground">One more thing...</h2>
            <p className="text-muted-foreground mb-6">Enter your contact info so we can reach out</p>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="(305) 555-0000"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0066CC] text-white hover:bg-[#0055AA] py-2 rounded-lg font-semibold"
              >
                Submit
              </Button>
            </form>

            <button
              onClick={() => setStep("results")}
              className="mt-4 w-full text-muted-foreground hover:text-foreground py-2"
            >
              Back
            </button>
          </>
        )}

        {step === "contact" && result && (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✓</div>
            <h3 className="text-xl font-bold mb-2 text-foreground">Thanks, {formData.firstName}!</h3>
            <p className="text-muted-foreground mb-6">We&apos;ll be in touch soon with next steps</p>
            <Button
              onClick={onClose}
              className="w-full bg-[#0066CC] text-white hover:bg-[#0055AA] py-2 rounded-lg font-semibold"
            >
              Back to Buildings
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
