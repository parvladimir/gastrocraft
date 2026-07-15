export type ContactAction = {
  ariaLabel: string;
  href: string;
  label: string;
  type: "phone" | "whatsapp";
  value: string;
};

export type ContactPerson = {
  actions: ContactAction[];
  name: string;
  role: string;
};

export const contactPeople: ContactPerson[] = [
  {
    actions: [
      {
        ariaLabel: "Andrej jetzt anrufen",
        href: "tel:+4917624229299",
        label: "Jetzt anrufen",
        type: "phone",
        value: "+49 176 24229299"
      },
      {
        ariaLabel: "Andrej per WhatsApp schreiben",
        href: "https://wa.me/380678400156",
        label: "WhatsApp schreiben",
        type: "whatsapp",
        value: "+380 67 840 0156"
      }
    ],
    name: "Andrej",
    role: "Beratung & Kundenkontakt"
  },
  {
    actions: [
      {
        ariaLabel: "Vladimir per WhatsApp schreiben",
        href: "https://wa.me/380963354328",
        label: "WhatsApp schreiben",
        type: "whatsapp",
        value: "+380 96 335 43 28"
      }
    ],
    name: "Vladimir",
    role: "Technik & Umsetzung"
  }
];
