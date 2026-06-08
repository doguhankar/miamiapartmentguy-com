'use client'

import { useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react'

interface FormData {
  moveDate: string
  apartmentSize: string
  budget: string
  neighborhoods: string[]
  creditScore: string
  name: string
  phone: string
}

const QUESTIONS = [
  { id: 0, label: 'When are you moving?', type: 'text', placeholder: 'e.g., Next month' },
  { id: 1, label: 'What size apartment?', type: 'radio', options: ['Studio', '1 Bed', '2 Beds', '3+ Beds'] },
  { id: 2, label: "What's your budget?", type: 'text', placeholder: 'e.g., $2,500' },
  {
    id: 3,
    label: 'Which neighborhoods?',
    type: 'checkbox',
    options: ['Brickell', 'Downtown', 'Midtown', 'Edgewater', 'Wynwood', 'Other'],
  },
  {
    id: 4,
    label: "How's your credit?",
    type: 'radio',
    options: ['Below 600', '600-700', '700-750+', 'No Credit/International'],
  },
  { id: 5, label: "What's your name?", type: 'text', placeholder: 'Your full name' },
  { id: 6, label: 'Best cell to reach you?', type: 'text', placeholder: 'Your phone number' },
]

interface MoveWithDonProps {
  isOpen: boolean
  onClose: () => void
}

export function MoveWithDon({ isOpen, onClose }: MoveWithDonProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    moveDate: '',
    apartmentSize: '',
    budget: '',
    neighborhoods: [],
    creditScore: '',
    name: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Reset form when modal closes
  const handleClose = () => {
    setCurrentStep(0)
    setFormData({
      moveDate: '',
      apartmentSize: '',
      budget: '',
      neighborhoods: [],
      creditScore: '',
      name: '',
      phone: '',
    })
    setShowSuccess(false)
    onClose()
  }

  const handleTextChange = (value: string) => {
    // Map step to field: steps 0, 2, 5, 6 are text inputs
    let fieldName: keyof FormData
    switch (currentStep) {
      case 0:
        fieldName = 'moveDate'
        break
      case 2:
        fieldName = 'budget'
        break
      case 5:
        fieldName = 'name'
        break
      case 6:
        fieldName = 'phone'
        break
      default:
        return
    }
    
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleRadioChange = (value: string) => {
    if (currentStep === 1) {
      setFormData((prev) => ({ ...prev, apartmentSize: value }))
    } else if (currentStep === 4) {
      setFormData((prev) => ({ ...prev, creditScore: value }))
    }
  }

  const handleCheckboxChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      neighborhoods: prev.neighborhoods.includes(value)
        ? prev.neighborhoods.filter((n) => n !== value)
        : [...prev.neighborhoods, value],
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.moveDate.trim() !== ''
      case 1:
        return formData.apartmentSize !== ''
      case 2:
        return formData.budget.trim() !== ''
      case 3:
        return formData.neighborhoods.length > 0
      case 4:
        return formData.creditScore !== ''
      case 5:
        return formData.name.trim() !== ''
      case 6:
        return formData.phone.trim() !== ''
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 1500)
      }
    } catch (error) {
      console.error('[v0] Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const question = QUESTIONS[currentStep]
  const isLastStep = currentStep === QUESTIONS.length - 1

  return (
    <>
      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          {/* Modal Container */}
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {showSuccess ? (
              // Success State
              <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-8">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center">Got it!</h2>
                <p className="text-gray-600 text-center mt-3">We&apos;ll reach out within 10 minutes</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-sm text-gray-500 font-medium">
                    {currentStep + 1} of {QUESTIONS.length}
                  </span>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <span className="text-gray-400 text-lg">×</span>
                  </button>
                </div>

                {/* Question */}
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{question.label}</h2>

                  {/* Input Fields */}
                  {question.type === 'text' && (
                    <input
                      type="text"
                      placeholder={question.placeholder}
                      value={
                        currentStep === 0
                          ? formData.moveDate
                          : currentStep === 2
                            ? formData.budget
                            : currentStep === 5
                              ? formData.name
                              : formData.phone
                      }
                      onChange={(e) => handleTextChange(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      autoFocus
                    />
                  )}

                  {question.type === 'radio' && (
                    <div className="space-y-3">
                      {question.options?.map((option) => (
                        <label key={option} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${currentStep}`}
                            value={option}
                            checked={
                              currentStep === 1 ? formData.apartmentSize === option : formData.creditScore === option
                            }
                            onChange={() => handleRadioChange(option)}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                          />
                          <span className="ml-3 text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkbox' && (
                    <div className="space-y-3">
                      {question.options?.map((option) => (
                        <label key={option} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            value={option}
                            checked={formData.neighborhoods.includes(option)}
                            onChange={() => handleCheckboxChange(option)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                          <span className="ml-3 text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    onClick={isLastStep ? handleSubmit : handleNext}
                    disabled={!canProceed() || isSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : isLastStep ? 'Submit' : 'Next'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
