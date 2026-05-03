import { profile } from '@/content/profile'

export const impressum = {
  legalReference: 'Angaben gem\u00e4\u00df \u00a7 5 DDG',
  intro: 'Provider information for this website and professional collaboration inquiries.',
  providerName: profile.name,
  providerAddressLines: ['Esslingen, Germany'],
  contactEmail: 'collabs@sarah-ghobj.com',
  instagramHandle: 'sarah_ghobj',
  instagramUrl: 'https://instagram.com/sarah_ghobj',
  editorialResponsible: profile.name,
  editorialScope: 'Responsible for the content of this website.',
} as const
