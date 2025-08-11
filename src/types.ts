export const entity_type_options = [
    { value: "", label: "Select Entity Type" },
    { value: "individual", label: "Individual" },
    { value: "llc", label: "LLC" },
    { value: "corporation", label: "Corporation" },
    { value: "partnership", label: "Partnership" },
    { value: "nonprofit", label: "Non-Profit" },
]

export const experience_level_options = [
    { value: "", label: "Select Experience Level" },
    { value: "first_time", label: "First-Time Investor" },
    { value: "some_experience", label: "1-3 Properties" },
    { value: "experienced", label: "4+ Properties" },
    { value: "professional", label: "Professional Developer" }
]

export const ownership_status_options = [
    { value: "", label: "Select Status" },
    { value: "owned", label: "Currently Own" },
    { value: "under_contract", label: "Under Contract" },
    { value: "negotiating", label: "Negotiating" },
    { value: "exploring", label: "Exploring Options" }
]

export const intended_use_options = [
    { value: "", label: "Select Use" },
    { value: "retail", label: "Retail" },
    { value: "restaurant", label: "Restaurant/Café" },
    { value: "office", label: "Office Space" },
    { value: "mixed", label: "Mixed Use" },
    { value: "community", label: "Community Space" },
    { value: "other", label: "Other" }
]

export const timeline_options = [
    { value: "", label: "Select Timeline" },
    { value: "immediate", label: "React to Start" },
    { value: "3_months", label: "Within 3 Months" },
    { value: "6_months", label: "Within 6 Months" },
    { value: "12_months", label: "Within 12 Months" },
]

export const help_level_options = [
    { value: "", label: "Select Level" },
    { value: "analysis", label: "Analysis Only" },
    { value: "guidance", label: "Analysis + Guidance" },
    { value: "full", label: "Full Support" },
]

export type EntityType = typeof entity_type_options[number]['value'];
export type ExperienceLevelType = typeof experience_level_options[number]['value'];
export type OwnershipStatusType = typeof ownership_status_options[number]['value'];
export type IntendedUseType = typeof intended_use_options[number]['value'];
export type TimelineType = typeof timeline_options[number]['value'];
export type HelpLevelType = typeof help_level_options[number]['value'];

export type CustomPropertyType = {
    id?: string | null,
    first_name: string,
    last_name: string,
    email: string,
    phone: string,
    entity_type: EntityType,
    company_name: string,
    experience_level: ExperienceLevelType,
    address: string,
    sqft: string,
    year_built: string,
    current_use: string,
    ownership_status: OwnershipStatusType,
    intended_use: IntendedUseType,
    timeline: TimelineType,
    help_level: HelpLevelType,
    description: string,
    selected_package?: string,
    selectedPackage?: string,
    created_at?: string | null,
    payment_status: string,
  }