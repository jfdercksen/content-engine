'use client'

import EmailIdeaForm from '@/components/forms/EmailIdeaForm'

export default function TestSimplifiedEmailFormPage() {
  return (
    <div className="container mx-auto py-8">
      <EmailIdeaForm 
        clientId="modern-management"
        onSave={(data) => {
          console.log('Form saved:', data)
          alert('Form saved successfully!')
        }}
        onCancel={() => {
          console.log('Form cancelled')
          window.history.back()
        }}
      />
    </div>
  )
}
