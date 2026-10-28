export interface FaqItem {
  question: string
  answer: string
}

/** FAQPage node for the questions the backend found under a "Hỏi đáp" heading. */
export const faqPageSchema = (items: FaqItem[] | null | undefined, url: string): Record<string, unknown> | null => {
  const valid = (items ?? []).filter(item => item?.question?.trim() && item?.answer?.trim())
  if (!valid.length) return null
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: valid.map(item => ({
      '@type': 'Question',
      name: item.question.trim(),
      acceptedAnswer: { '@type': 'Answer', text: item.answer.trim() },
    })),
  }
}
