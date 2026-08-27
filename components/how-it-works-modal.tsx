'use client';

import React, { useState } from 'react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const faqs = [
    {
      question: 'How is this free?',
      answer: 'Buildings pay Don a commission when you sign a lease — the same fee they\'d pay any agent. You never pay anything, ever.'
    },
    {
      question: 'Why do I need MAG? Can\'t I just represent myself?',
      answer: 'You can. But Don already knows current concessions, floor plans, and which units are actually available — saving you hours of calling buildings yourself. And it costs the same either way: free.'
    },
    {
      question: 'Do I have to use MAG?',
      answer: 'No. Browse the map, take the info, and go direct if you want. There\'s no obligation to text Don or work with him.'
    },
    {
      question: 'Does it cost me anything if I don\'t get approved?',
      answer: 'No. You only pay the building directly if you sign a lease — same as always. Don\'s fee comes from the building, not you.'
    },
    {
      question: 'What if I already found a building I like?',
      answer: 'Text Don the building name. He\'ll pull current pricing and concessions even if it\'s not listed on the map yet.'
    },
    {
      question: 'How fast does Don respond?',
      answer: 'Usually within minutes during the day. He\'s actively working leads, not running a call center.'
    },
    {
      question: 'Is the pricing on the site always accurate?',
      answer: 'Prices update regularly but can shift daily. Text Don for the live number before you tour or apply.'
    }
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4,8,16,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 999
    }}>
      <div style={{
        background: '#111C2E',
        border: '0.5px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#C3CEDD',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          ✕
        </button>

        {/* Content */}
        <div style={{ padding: '32px 28px 28px' }}>
          {/* Header Label */}
          <div style={{
            fontSize: '12px',
            letterSpacing: '0.08em',
            color: '#19C6C0',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            How MAG Works
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: '26px',
            fontWeight: 600,
            color: '#fff',
            marginBottom: '10px',
            lineHeight: 1.2
          }}>
            Free apartment hunting, done right
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '14px',
            color: '#8FA0B8',
            lineHeight: 1.5,
            marginBottom: '28px'
          }}>
            Skip the broker fees. Search 108+ Miami buildings and let Don handle the rest — <span style={{ color: '#FFC24B', fontWeight: 500 }}>completely free for renters.</span>
          </p>

          {/* 3-Step Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            marginBottom: '24px'
          }}>
            {[
              { num: 1, title: 'Search', desc: 'Browse buildings by neighborhood, price, and move-in date.' },
              { num: 2, title: 'Text Don', desc: 'Send your budget and timeline. Get real pricing in minutes.' },
              { num: 3, title: 'Move in', desc: 'Don negotiates your deal and gets you the best concessions.' }
            ].map((step) => (
              <div key={step.num} style={{
                background: '#0B1220',
                borderRadius: '12px',
                padding: '16px 14px'
              }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: '#FF4D8D',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}>
                  {step.num}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#fff',
                  marginBottom: '6px'
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#8FA0B8',
                  lineHeight: 1.5
                }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Split Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '28px'
          }}>
            {/* You Decide */}
            <div style={{
              borderRadius: '12px',
              padding: '16px',
              background: 'rgba(25,198,192,0.08)',
              border: '0.5px solid rgba(25,198,192,0.25)'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '10px'
              }}>
                You decide
              </div>
              <ul style={{ listStyle: 'none' }}>
                {['Which buildings you like', 'Your budget and move-in date', 'When you\'re ready to apply'].map((item) => (
                  <li key={item} style={{
                    fontSize: '12px',
                    color: '#C3CEDD',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '8px',
                    lineHeight: 1.4
                  }}>
                    <span style={{ color: '#19C6C0', flexShrink: 0 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Don Handles */}
            <div style={{
              borderRadius: '12px',
              padding: '16px',
              background: 'rgba(255,77,141,0.08)',
              border: '0.5px solid rgba(255,77,141,0.25)'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                marginBottom: '10px'
              }}>
                Don handles
              </div>
              <ul style={{ listStyle: 'none' }}>
                {['Live pricing and concessions', 'Touring and scheduling', 'Application and lease help'].map((item) => (
                  <li key={item} style={{
                    fontSize: '12px',
                    color: '#C3CEDD',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px',
                    marginBottom: '8px',
                    lineHeight: 1.4
                  }}>
                    <span style={{ color: '#FF4D8D', flexShrink: 0 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              background: '#FF4D8D',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#E63A77')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FF4D8D')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Start searching
          </button>

          {/* FAQ Section */}
          <div style={{ marginTop: '28px' }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              marginBottom: '12px'
            }}>
              Common questions
            </div>

            {faqs.map((faq, index) => (
              <div key={index} style={{
                background: '#0B1220',
                borderRadius: '8px',
                marginBottom: '8px',
                overflow: 'hidden'
              }}>
                <div
                  onClick={() => toggleFaq(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 14px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#E6ECF5',
                    fontWeight: 500,
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span>{faq.question}</span>
                  <span style={{
                    color: '#6F7F96',
                    fontSize: '16px',
                    flexShrink: 0,
                    marginLeft: '12px',
                    transition: 'transform 0.2s',
                    transform: expandedFaqIndex === index ? 'rotate(45deg)' : 'rotate(0deg)'
                  }}>
                    +
                  </span>
                </div>

                {expandedFaqIndex === index && (
                  <div style={{
                    padding: '0 14px 14px',
                    fontSize: '12px',
                    color: '#8FA0B8',
                    lineHeight: 1.6
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
