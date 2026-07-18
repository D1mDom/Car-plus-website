import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "តើអ្នកផ្តល់ធានាអ្វីខ្លះ?",
    answer: "រថយន្តទាំងអស់របស់យើងមានធានា ៦ ខែ គ្របដណ្តប់ម៉ាស៊ីន និងប្រអប់លេខ។ ជម្រើសធានាបន្ថែមក៏មានសម្រាប់ទិញផងដែរ។",
  },
  {
    question: "តើអ្នកផ្តល់ជម្រើសហិរញ្ញវត្ថុដែរឬទេ?",
    answer: "បាទ/ចាស! យើងសហការជាមួយធនាគារជាច្រើនដើម្បីផ្តល់ជម្រើសហិរញ្ញវត្ថុបត់បែន។ ក្រុមការងារយើងអាចជួយអ្នករកអត្រា និងលក្ខខណ្ឌល្អបំផុត។",
  },
  {
    question: "តើខ្ញុំអាចដូរឡានចាស់របស់ខ្ញុំបានទេ?",
    answer: "បាទ/ចាស! យើងទទួលយកឡានដូរ ហើយអាចផ្តល់តម្លៃប្រកួតប្រជែងសម្រាប់រថយន្តបច្ចុប្បន្នរបស់អ្នក។ នាំវាមកសម្រាប់ការវាយតម្លៃឥតគិតថ្លៃ។",
  },
  {
    question: "តើខ្ញុំធ្វើយ៉ាងណាដើម្បីណាត់ជួបសាកឡាន?",
    answer: "អ្នកអាចណាត់ជួបសាកឡានដោយទាក់ទងមកយើងតាមទូរស័ព្ទ តេឡេក្រាម ឬប្រើទម្រង់ទំនាក់ទំនងនៅលើគេហទំព័ររបស់យើង។",
  },
  {
    question: "តើខ្ញុំត្រូវការឯកសារអ្វីខ្លះដើម្បីទិញឡាន?",
    answer: "អ្នកត្រូវការអត្តសញ្ញាណប័ណ្ណ ភស្តុតាងអាសយដ្ឋាន និងភស្តុតាងប្រាក់ចំណូលប្រសិនបើបង់រំលស់។ ក្រុមការងារយើងនឹងណែនាំអ្នកក្នុងការរៀបចំឯកសារទាំងអស់។",
  },
  {
    question: "តើអ្នកដឹកជញ្ជូនឡាននៅក្រៅភ្នំពេញដែរឬទេ?",
    answer: "បាទ/ចាស យើងផ្តល់សេវាដឹកជញ្ជូនទូទាំងប្រទេសកម្ពុជា។ ថ្លៃដឹកជញ្ជូនខុសគ្នាទៅតាមចម្ងាយ។ ទាក់ទងមកយើងសម្រាប់សម្រង់តម្លៃ។",
  },
];

const FAQSection = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">សំណួរដែលគេសួរញឹកញាប់</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`} className="border-border">
            <AccordionTrigger className="text-left text-sm hover:text-primary">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FAQSection;
