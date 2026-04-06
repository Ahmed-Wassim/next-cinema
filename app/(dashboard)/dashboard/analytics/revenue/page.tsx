"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTrends } from "@/lib/analytics-api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AnalyticsRevenuePage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRevenue() {
      try {
        const res = await fetchTrends();
        setTrends(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load trends", err);
      } finally {
        setLoading(false);
      }
    }
    loadRevenue();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Group by date
  const dateMap = new Map<string, number>();
  trends.forEach(item => {
     const date = item._id?.date;
     if (date) {
        const current = dateMap.get(date) || 0;
        dateMap.set(date, current + (item.total_revenue || 0));
     }
  });
  
  const dailyRevenues = Array.from(dateMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, revenue]) => ({ date, revenue }));

  return (
    <div className="space-y-6">
      <div>
         <h2 className="text-2xl font-bold tracking-tight text-white">Revenue Metrics</h2>
         <p className="text-zinc-400">Deep dive into financial performance over time.</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
         <CardHeader>
           <CardTitle>Daily Revenue Chart</CardTitle>
         </CardHeader>
         <CardContent>
            {loading ? (
               <div className="h-[300px] flex items-center justify-center text-zinc-500">Loading chart...</div>
            ) : dailyRevenues.length > 0 ? (
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={dailyRevenues} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                     <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--primary)' }}
                     />
                     <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {dailyRevenues.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="var(--primary)" />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">No revenue data available</div>
            )}
         </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
         <CardHeader>
           <CardTitle>Daily Revenue Ledger</CardTitle>
         </CardHeader>
         <CardContent>
            {loading ? (
               <div className="h-[200px] flex items-center justify-center text-zinc-500">Loading revenue trends...</div>
            ) : (
               <div className="relative w-full overflow-auto">
                 <table className="w-full caption-bottom text-sm text-left">
                   <thead className="[&_tr]:border-b [&_tr]:border-zinc-800">
                     <tr className="border-b transition-colors hover:bg-white/5 data-[state=selected]:bg-zinc-800">
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400">Date</th>
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400 text-right">Daily Gross</th>
                     </tr>
                   </thead>
                   <tbody className="[&_tr:last-child]:border-0">
                     {dailyRevenues.map((row) => (
                       <tr key={row.date} className="border-b border-zinc-800 transition-colors hover:bg-white/5">
                         <td className="p-4 align-middle font-medium">{row.date}</td>
                         <td className="p-4 align-middle text-right font-bold text-[color:var(--primary)]">{formatCurrency(row.revenue)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {dailyRevenues.length === 0 && <div className="text-center py-6 text-zinc-500">No revenue data available</div>}
               </div>
            )}
         </CardContent>
      </Card>
    </div>
  );
}
