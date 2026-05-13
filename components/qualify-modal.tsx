"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Building } from "@/lib/buildings"

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

    console.log("[v0] Lead captured:", {
      buildingName: building.name,
      income: formData.income,
      creditScore: formData.credit,
      moveInDate: formData.moveInDate,
      qualificationStatus: result,
      firstName: formData.firstName,
      phone: formData.phone,
    })

    setStep("contact")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {step === "form" && `See If You Qualify for ${building.name}`}
            {step === "results" && "Your Results"}
            {step === "contact" && "Great!"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Income
                </label>
                <input
                  type="number"
                  required
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Score
                </label>
                <input
                  type="number"
                  required
                  value={formData.credit}
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                  placeholder="000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Move-in Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition mt-6"
              >
                Check Qualification
              </button>
            </form>
          )}

          {step === "results" && result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                result === "qualify" ? "bg-green-50" :
                result === "close" ? "bg-yellow-50" :
                "bg-red-50"
              }`}>
                <p className={`text-sm font-medium mb-1 ${
                  result === "qualify" ? "text-green-900" :
                  result === "close" ? "text-yellow-900" :
                  "text-red-900"
                }`}>
                  {result === "qualify" && "✓ You Qualify!"}
                  {result === "close" && "⚠ You're Close"}
                  {result === "not-fit" && "✗ Not a Fit"}
                </p>
                <p className={`text-sm ${
                  result === "qualify" ? "text-green-700" :
                  result === "close" ? "text-yellow-700" :
                  "text-red-700"
                }`}>
                  {result === "qualify" && "Great news! You meet the qualification requirements."}
                  {result === "close" && "You're close to qualifying. Consider increasing income or credit score."}
                  {result === "not-fit" && "Unfortunately, you don't meet the current requirements. Try again later!"}
                </p>
              </div>

              <button
                onClick={() => setStep("contact")}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Continue
              </button>
            </div>
          )}

          {step === "contact" && (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(305) 555-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition mt-6"
              >
                Submit
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
