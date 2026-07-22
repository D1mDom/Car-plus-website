import { useContact } from "@/hooks/useContact";

// The admin can paste EITHER a full Google Maps <iframe ...> embed code OR just
// the embed URL. This pulls the src out of a full iframe if that's what was saved.
const extractSrc = (value: string): string => {
  const match = value.match(/src="([^"]+)"/);
  return match ? match[1] : value.trim();
};

const LocationMap = () => {
  const { data: contact } = useContact();
  if (!contact?.map_link) return null;

  const src = extractSrc(contact.map_link);

  return (
    <section id="location" className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl">ទីតាំងរបស់យើង</h2>
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <iframe
            src={src}
            title="Car Plus location"
            className="h-[300px] w-full sm:h-[450px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
