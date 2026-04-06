"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTrends } from "@/lib/analytics-api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

const COLORS = ['var(--primary)', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AnalyticsMoviesPage() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMovies() {
      try {
        const res = await fetchTrends();
        setTrends(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Failed to load movies", err);
      } finally {
        setLoading(false);
      }
    }
    loadMovies();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  // Group by movie
  const movieMap = new Map<number, { title: string, revenue: number, bookings: number }>();
  trends.forEach(item => {
     let movieTitle = "Unknown";
     try {
       const parsedData = JSON.parse(item.title);
       movieTitle = parsedData.en || parsedData;
     } catch {
       movieTitle = item.title;
     }

     const movieId = item._id?.movie_id;
     if (movieId) {
        if (!movieMap.has(movieId)) {
           movieMap.set(movieId, { title: movieTitle, revenue: 0, bookings: 0 });
        }
        movieMap.get(movieId)!.revenue += item.total_revenue || 0;
        movieMap.get(movieId)!.bookings += item.total_bookings || 0;
     }
  });
  
  const moviePerformances = Array.from(movieMap.values())
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      <div>
         <h2 className="text-2xl font-bold tracking-tight text-white">Movie Performance</h2>
         <p className="text-zinc-400">Detailed analytics on how individual Box Office performances rank.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
             <CardTitle>Lifetime Gross by Title</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="h-[300px] flex items-center justify-center text-zinc-500">Loading chart...</div>
             ) : moviePerformances.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moviePerformances} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="title" stroke="rgba(255,255,255,0.4)" fontSize={11} angle={-35} textAnchor="end" />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickFormatter={(val) => `$${val}`} />
                      <Tooltip 
                         cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                         itemStyle={{ color: 'var(--primary)' }}
                      />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                         {moviePerformances.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">No movie data available</div>
             )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader>
             <CardTitle>Tickets Sold (Market Share)</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="h-[300px] flex items-center justify-center text-zinc-500">Loading ratio...</div>
             ) : moviePerformances.length > 0 && moviePerformances.some(d => d.bookings > 0) ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moviePerformances}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="bookings"
                        nameKey="title"
                        stroke="none"
                      >
                        {moviePerformances.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                         itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-500 text-sm">No ticket data available</div>
             )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
         <CardHeader>
           <CardTitle>Box Office Detail Ledger</CardTitle>
         </CardHeader>
         <CardContent>
            {loading ? (
               <div className="h-[200px] flex items-center justify-center text-zinc-500">Loading movie trends...</div>
            ) : (
               <div className="relative w-full overflow-auto">
                 <table className="w-full caption-bottom text-sm text-left">
                   <thead className="[&_tr]:border-b [&_tr]:border-zinc-800">
                     <tr className="border-b transition-colors hover:bg-white/5 data-[state=selected]:bg-zinc-800">
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400">Movie Title</th>
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400">Tickets Sold</th>
                       <th className="h-10 px-4 align-middle font-medium text-zinc-400 text-right">Gross Revenue</th>
                     </tr>
                   </thead>
                   <tbody className="[&_tr:last-child]:border-0">
                     {moviePerformances.map((row) => (
                       <tr key={row.title} className="border-b border-zinc-800 transition-colors hover:bg-white/5">
                         <td className="p-4 align-middle font-medium">{row.title}</td>
                         <td className="p-4 align-middle">{row.bookings}</td>
                         <td className="p-4 align-middle text-right font-bold text-[color:var(--primary)]">{formatCurrency(row.revenue)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {moviePerformances.length === 0 && <div className="text-center py-6 text-zinc-500">No movie data available</div>}
               </div>
            )}
         </CardContent>
      </Card>
    </div>
  );
}
