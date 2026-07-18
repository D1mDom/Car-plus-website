import { Clock, CheckCircle, XCircle } from "lucide-react";

const businessHours = [
  { day: "ច័ន", fullDay: "ច័ន្ទ", hours: "8:00 - 20:00" },
  { day: "អង្គ", fullDay: "អង្គារ", hours: "8:00 - 20:00" },
  { day: "ពុធ", fullDay: "ពុធ", hours: "8:00 - 20:00" },
  { day: "ព្រហ", fullDay: "ព្រហស្បតិ៍", hours: "8:00 - 20:00" },
  { day: "សុក្រ", fullDay: "សុក្រ", hours: "8:00 - 20:00" },
  { day: "សៅរ៍", fullDay: "សៅរ៍", hours: "8:00 - 18:00" },
  { day: "អាទិ", fullDay: "អាទិត្យ", hours: "8:00 - 18:00" },
];

const isCurrentlyOpen = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  if (day === 0 || day === 6) return hour >= 8 && hour < 18;
  return hour >= 8 && hour < 20;
};

const BusinessHours = () => {
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;
  const isOpen = isCurrentlyOpen();

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-ocean/10 rounded-2xl p-6 border border-primary/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg text-foreground">ម៉ោងធ្វើការ</h3>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isOpen 
            ? "bg-green-500/10 text-green-600 border border-green-500/30" 
            : "bg-red-500/10 text-red-500 border border-red-500/30"
        }`}>
          {isOpen ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>កំពុងបើក</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>បិទ</span>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {businessHours.map((item, index) => {
          const isToday = index === dayIndex;
          return (
            <div
              key={item.day}
              className={`relative flex flex-col items-center p-3 rounded-xl transition-all duration-300 ${
                isToday
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <span className={`text-xs font-bold uppercase tracking-wider ${
                isToday ? "text-primary-foreground" : "text-muted-foreground"
              }`}>
                {item.day}
              </span>
              <div className={`mt-2 text-center ${isToday ? "text-primary-foreground" : "text-foreground"}`}>
                <div className="text-xs font-medium">
                  {item.hours.split(" - ")[0]}
                </div>
                <div className="text-[10px] opacity-70 my-0.5">ដល់</div>
                <div className="text-xs font-medium">
                  {item.hours.split(" - ")[1]}
                </div>
              </div>
              {isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-center text-sm text-muted-foreground">
          ថ្ងៃនេះ ({businessHours[dayIndex].fullDay}): {" "}
          <span className="font-semibold text-foreground">{businessHours[dayIndex].hours}</span>
        </p>
      </div>
    </div>
  );
};

export default BusinessHours;
