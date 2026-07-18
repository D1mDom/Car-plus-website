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
      <section id="about" className="py-24 bg-gradient-light">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-bordered">
              អំពី <span className="text-gradient-ocean">Car Plus</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              បង្កើតឡើងក្នុងឆ្នាំ ២០១៤ Car Plus បានរីកចម្រើនពីអាជីវកម្មគ្រួសារតូចមួយ ទៅជាឈ្មួញលក់រថយន្តដែលទុកចិត្តបំផុតមួយនៅភ្នំពេញ។ បេសកកម្មរបស់យើងគឺផ្តល់រថយន្តគុណភាពខ្ពស់ជាមួយប្រវត្តិថ្លាភ្លឺ ធានា និងសេវាកម្មអតិថិជនល្អឥតខ្ចោះ។
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-xl bg-card border-2 border-border">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold text-gradient-ocean mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature) => (
              <div key={feature.title} className="group p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground text-bordered-light">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mb-16">
            <h3 className="text-2xl font-bold text-center mb-8 text-bordered">
              ស្គាល់ <span className="text-gradient-ocean">ក្រុមការងារ</span>យើង
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member) => (
                <div key={member.name} className="text-center p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 transition-all duration-300">
                  <img src={member.image} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-primary/20" />
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-bordered mb-6">
              ទស្សនា <span className="text-gradient-ocean">សាលបង្ហាញ</span>រយើង
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-8">
              សូមអញ្ជើញមកមើលរថយន្តគុណភាពរបស់យើងដោយផ្ទាល់។ ក្រុមការងាររបស់យើងរួចរាល់ជួយអ្នកស្វែងរកឡានដ៏ល្អឥតខ្ចោះ។
            </p>
            
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border-2 border-border">
                <MapPin className="h-6 w-6 text-primary" />
                <p className="font-medium text-foreground">អាសយដ្ឋាន</p>
                <p className="text-sm text-muted-foreground text-center">ផ្ទះ ៣៩៣ ផ្លូវឧកញ៉ា ម៉ុង ឫទ្ធី (១៩២៨) ភ្នំពេញ ១២១០១</p>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border-2 border-border">
                <Phone className="h-6 w-6 text-primary" />
                <p className="font-medium text-foreground">ទូរស័ព្ទ</p>
                <p className="text-sm text-muted-foreground">069 927 292</p>
              </div>
              
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border-2 border-border">
                <MessageCircle className="h-6 w-6 text-primary" />
                <p className="font-medium text-foreground">តេឡេក្រាម</p>
                <p className="text-sm text-muted-foreground">@carplus_cambodia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-bordered">
              ទំនាក់ <span className="text-gradient-ocean">ទំនង</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              មានសំណួរអំពីឡាន ឬចង់ណាត់ជួបសាកឡាន? ទាក់ទងមកយើង ហើយក្រុមការងារយើងនឹងឆ្លើយតបជូនឆាប់រហ័ស។
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="bg-card p-8 rounded-xl border-2 border-border">
              <h3 className="text-xl font-bold mb-6 text-bordered">ផ្ញើសារមកយើង</h3>
              <ContactForm />
            </div>

            <div className="space-y-8">
              <div className="bg-card p-6 rounded-xl border-2 border-border">
                <BusinessHours />
              </div>
              
              <div className="bg-card p-6 rounded-xl border-2 border-border">
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
