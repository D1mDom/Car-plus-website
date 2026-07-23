import { Shield, Award, Wrench, CreditCard, MapPin, Phone, MessageCircle, Users, Car, Trophy, Clock } from "lucide-react";
import ContactForm from "./ContactForm";
import BusinessHours from "./BusinessHours";
import SocialLinks from "./SocialLinks";

const features = [
  {
    icon: Shield,
    title: "មានធានា",
    description: "ធានា ៦ ខែលើម៉ាស៊ីន និងប្រអប់លេខជាមួយរាល់ការទិញ។",
  },
  {
    icon: Award,
    title: "គុណភាពធានា",
    description: "រថយន្តទាំងអស់ត្រូវបានត្រួតពិនិត្យ និងបញ្ជាក់មុនលក់។",
  },
  {
    icon: Wrench,
    title: "ប្រវត្តិសេវាកម្មពេញលេញ",
    description: "ឯកសារគ្រប់គ្រាន់ និងប្រវត្តិរថយន្តថ្លាភ្លឺ។",
  },
  {
    icon: CreditCard,
    title: "ហិរញ្ញវត្ថុបត់បែន",
    description: "ជម្រើសបង់រំលស់ងាយស្រួលជាមួយហិរញ្ញវត្ថុសម្រាប់អតិថិជនទាំងអស់។",
  },
];

const stats = [
  { icon: Clock, value: "10+", label: "ឆ្នាំបទពិសោធន៍" },
  { icon: Car, value: "500+", label: "ឡានបានលក់" },
  { icon: Users, value: "450+", label: "អតិថិជនសប្បាយចិត្ត" },
  { icon: Trophy, value: "#1", label: "ឈ្មួញទុកចិត្ត" },
];

const teamMembers = [
  {
    name: "សុវណ្ណ ចេន",
    role: "ស្ថាបនិក និង CEO",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "តារា គឹម",
    role: "អ្នកគ្រប់គ្រងផ្នែកលក់",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "ស្រីមុំ ផាន់",
    role: "អ្នកឯកទេសហិរញ្ញវត្ថុ",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
  },
  {
    name: "វីរៈ ហេង",
    role: "អ្នកគ្រប់គ្រងសេវាកម្ម",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  },
];

const AboutSection = () => {
  return (
    <>
      <section id="about" className="py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              អំពី <span className="text-primary">Car Plus</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              បង្កើតឡើងក្នុងឆ្នាំ ២០១៤ Car Plus បានរីកចម្រើនពីអាជីវកម្មគ្រួសារតូចមួយ ទៅជាឈ្មួញលក់រថយន្តដែលទុកចិត្តបំផុតមួយនៅភ្នំពេញ។ បេសកកម្មរបស់យើងគឺផ្តល់រថយន្តគុណភាពខ្ពស់ជាមួយប្រវត្តិថ្លាភ្លឺ ធានា និងសេវាកម្មអតិថិជនល្អឥតខ្ចោះ។
            </p>
          </div>

          {/* Stats - one card with dividers */}
          <div className="mb-16 grid grid-cols-2 divide-border overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:border-b sm:[&>*]:border-b-0 [&>*:nth-child(odd)]:border-r sm:[&>*:nth-child(odd)]:border-r-0">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-2 border-border p-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Features - left-aligned cards */}
          <div className="mb-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Team - sleek left-aligned cards */}
          <div className="mb-16">
            <h3 className="mb-8 text-center text-2xl font-bold text-foreground">
              ស្គាល់ <span className="text-primary">ក្រុមការងារ</span>យើង
            </h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <div key={member.name} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
                  <img src={member.image} alt={member.name} className="mb-4 h-16 w-16 rounded-full object-cover" />
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Showroom / quick contact */}
          <div className="mx-auto max-w-3xl text-center">
            <h3 className="mb-4 text-2xl font-bold text-foreground">
              ទស្សនា <span className="text-primary">សាលបង្ហាញ</span>យើង
            </h3>
            <p className="mb-8 leading-relaxed text-muted-foreground">
              សូមអញ្ជើញមកមើលរថយន្តគុណភាពរបស់យើងដោយផ្ទាល់។ ក្រុមការងាររបស់យើងរួចរាល់ជួយអ្នកស្វែងរកឡានដ៏ល្អឥតខ្ចោះ។
            </p>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="font-medium text-foreground">អាសយដ្ឋាន</p>
                <p className="text-center text-sm text-muted-foreground">ផ្ទះ ៣៩៣ ផ្លូវឧកញ៉ា ម៉ុង ឫទ្ធី (១៩២៨) ភ្នំពេញ ១២១០១</p>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <p className="font-medium text-foreground">ទូរស័ព្ទ</p>
                <p className="text-sm text-muted-foreground">069 927 292</p>
              </div>

              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <p className="font-medium text-foreground">តេឡេក្រាម</p>
                <p className="text-sm text-muted-foreground">@carplus_cambodia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-border bg-card py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              ទំនាក់ <span className="text-primary">ទំនង</span>
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              មានសំណួរអំពីឡាន ឬចង់ណាត់ជួបសាកឡាន? ទាក់ទងមកយើង ហើយក្រុមការងារយើងនឹងឆ្លើយតបជូនឆាប់រហ័ស។
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <h3 className="mb-6 text-xl font-bold text-foreground">ផ្ញើសារមកយើង</h3>
              <ContactForm />
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-background p-6">
                <BusinessHours />
              </div>

              <div className="rounded-2xl border border-border bg-background p-6">
                <SocialLinks />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AboutSection;
