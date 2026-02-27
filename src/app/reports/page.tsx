"use client";

import { useState, useEffect } from "react";
import { format, isSameDay, isSameMonth, isSameYear, parseISO } from "date-fns";
import { getAllOrders } from "@/app/actions";
import Image from "next/image";

export default function ReportsPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [filter, setFilter] = useState("all"); // 'all', 'daily', 'monthly', 'yearly'
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [fullImage, setFullImage] = useState<string | null>(null);

    useEffect(() => {
        getAllOrders().then(data => setOrders(data));
    }, []);

    const filteredOrders = orders.filter(order => {
        if (filter === "all") return true;
        const oDate = new Date(order.orderDate);
        const fDate = new Date(filterDate);

        if (filter === "daily") return isSameDay(oDate, fDate);
        if (filter === "monthly") return isSameMonth(oDate, fDate);
        if (filter === "yearly") return isSameYear(oDate, fDate);
        return true;
    });

    const income = filteredOrders.filter(o => o.isPaid).reduce((acc, curr) => acc + curr.totalAmount, 0);

    const formatTime = (isoString: string | null | undefined) => {
        if (!isoString) return "-";
        return format(new Date(isoString), "HH:mm");
    }

    const handleExportCSV = () => {
        const headers = ["ID", "Status", "Order Time", "Validated Time", "Preparing Time", "Ready Time", "Delivering Time", "Delivered Time", "Total Amount", "Paid"];
        const rows = filteredOrders.map(o => [
            o.id, 
            o.status, 
            formatTime(o.orderDate),
            formatTime(o.validatedAt),
            formatTime(o.preparingAt),
            formatTime(o.readyAt),
            formatTime(o.deliveringAt),
            formatTime(o.deliveredAt),
            o.totalAmount,
            o.isPaid ? 'Yes' : 'No'
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Report_${filter}_${filterDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        window.print();
    };

    const handleExportXLSX = () => {
        // Simple hack: Export as HTML table with .xls extension which excel reads perfectly
        let tableHTML = `<table border="1"><tr><th>ID</th><th>Status</th><th>Order Time</th><th>Validated</th><th>Preparing</th><th>Ready</th><th>Delivering</th><th>Delivered</th><th>Amount</th></tr>`;
        filteredOrders.forEach(o => {
            tableHTML += `<tr><td>${o.id}</td><td>${o.status}</td><td>${formatTime(o.orderDate)}</td><td>${formatTime(o.validatedAt)}</td><td>${formatTime(o.preparingAt)}</td><td>${formatTime(o.readyAt)}</td><td>${formatTime(o.deliveringAt)}</td><td>${formatTime(o.deliveredAt)}</td><td>${o.totalAmount}</td></tr>`;
        });
        tableHTML += `</table>`;
        const uri = 'data:application/vnd.ms-excel;base64,' + btoa(unescape(encodeURIComponent(tableHTML)));
        const link = document.createElement("a");
        link.href = uri;
        link.download = `Report_${filter}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] p-8 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 font-sans relative">
            <h1 className="text-4xl font-black mb-2 tracking-tighter text-blue-900 dark:text-blue-100 print:hidden">Financial & Audit Reports</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-lg print:hidden">
                Generate and export detailed sales analysis and delivery milestones for audit tracking. 
            </p>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 mb-8 print:hidden">
                <div className="flex flex-wrap gap-4 items-end mb-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-zinc-500">Filter By</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg font-medium outline-none">
                            <option value="all">All Time</option>
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    {filter !== "all" && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-zinc-500">Select Date/Range</label>
                            <input 
                               type="date" 
                               value={filterDate} 
                               onChange={(e) => setFilterDate(e.target.value)}
                               className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg font-medium outline-none"
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <p className="text-sm font-bold text-zinc-500 mb-1">Total Orders</p>
                        <p className="text-3xl font-black">{filteredOrders.length}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <p className="text-sm font-bold text-zinc-500 mb-1">Completed Deliveries</p>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{filteredOrders.filter(o => o.status === 'delivered').length}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <p className="text-sm font-bold text-zinc-500 mb-1">Pending Delivery</p>
                        <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{filteredOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                        <p className="text-sm font-bold text-zinc-500 mb-1">Cancelled Orders</p>
                        <p className="text-3xl font-black text-red-600 dark:text-red-400">{filteredOrders.filter(o => o.status === 'cancelled').length}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500 mb-1">Total Income (Paid)</p>
                        <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400">Rp {income.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl mb-8 print:hidden">
                <h3 className="text-xl font-bold mb-4">Export Tools</h3>
                <div className="flex flex-wrap gap-4">
                    <button onClick={handleExportPDF} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md">Export PDF (Print)</button>
                    <button onClick={handleExportXLSX} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md">Export Excel (XLS)</button>
                    <button onClick={handleExportCSV} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl active:scale-95 transition-all shadow-md">Export CSV</button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:border-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            <tr>
                                <th className="p-4 font-bold">ID</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Amount</th>
                                <th className="p-4 font-bold bg-blue-50 dark:bg-blue-900/10 border-l border-white dark:border-zinc-800 text-center" title="Order Placed">ORDR</th>
                                <th className="p-4 font-bold bg-green-50 dark:bg-green-900/10 border-l border-white dark:border-zinc-800 text-center" title="Validated">VLD</th>
                                <th className="p-4 font-bold bg-amber-50 dark:bg-amber-900/10 border-l border-white dark:border-zinc-800 text-center" title="Preparing">PRP</th>
                                <th className="p-4 font-bold bg-orange-50 dark:bg-orange-900/10 border-l border-white dark:border-zinc-800 text-center" title="Ready for Delivery">RDY</th>
                                <th className="p-4 font-bold bg-purple-50 dark:bg-purple-900/10 border-l border-white dark:border-zinc-800 text-center" title="On the Way">OTW</th>
                                <th className="p-4 font-bold bg-emerald-50 dark:bg-emerald-900/10 border-l border-white dark:border-zinc-800 text-center" title="Delivered">DLV</th>
                                <th className="p-4 font-bold text-center">Proof</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {filteredOrders.length === 0 && (
                                <tr><td colSpan={10} className="p-8 text-center text-zinc-500 italic">No orders found for the selected filter.</td></tr>
                            )}
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="p-4 font-bold text-zinc-900 dark:text-zinc-100">
                                       {order.id}
                                       {order.isPaid && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-500" title="Paid"></span>}
                                    </td>
                                    <td className="p-4">
                                       <span className={`uppercase text-[10px] font-black tracking-widest px-2 py-1 rounded text-white ${order.status === 'cancelled' ? 'bg-red-500' : 'bg-zinc-400 dark:bg-zinc-600'}`}>
                                         {order.status}
                                       </span>
                                    </td>
                                    <td className="p-4 font-medium">Rp {order.totalAmount.toLocaleString()}</td>
                                    
                                    {/* Milestones */}
                                    <td className="p-4 font-mono text-xs text-center border-l border-zinc-100 dark:border-zinc-800">{formatTime(order.orderDate)}</td>
                                    <td className="p-4 font-mono text-xs text-center border-l border-zinc-100 dark:border-zinc-800">{formatTime(order.validatedAt)}</td>
                                    <td className="p-4 font-mono text-xs text-center border-l border-zinc-100 dark:border-zinc-800">{formatTime(order.preparingAt)}</td>
                                    <td className="p-4 font-mono text-xs text-center border-l border-zinc-100 dark:border-zinc-800">{formatTime(order.readyAt)}</td>
                                    <td className="p-4 font-mono text-xs text-center border-l border-zinc-100 dark:border-zinc-800">{formatTime(order.deliveringAt)}</td>
                                    <td className="p-4 font-mono text-xs text-center border-l border-zinc-100 dark:border-zinc-800">{formatTime(order.deliveredAt)}</td>
                                    <td className="p-4 text-center">
                                       {order.deliveryProofUrl ? (
                                           <button onClick={() => setFullImage(order.deliveryProofUrl)} className="text-xs font-bold text-blue-600 hover:underline">View Proof</button>
                                       ) : (
                                           <span className="text-zinc-400">-</span>
                                       )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Print Header */}
            <div className="hidden print:block fixed top-0 left-0 w-full mb-8 text-black">
               <h1 className="text-2xl font-black mb-1">Financial & Audit Milestone Report</h1>
               <p className="text-sm">Filter: {filter.toUpperCase()} | Date: {filterDate} | Total Income: Rp {income.toLocaleString()}</p>
            </div>

            {/* Modal for Full Image */}
            {fullImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:hidden" onClick={() => setFullImage(null)}>
                   <div className="relative max-w-4xl w-full h-full max-h-[90vh] flex flex-col items-center justify-center">
                      <button className="absolute top-0 right-0 p-4 text-white hover:text-red-500 text-3xl font-black" onClick={() => setFullImage(null)}>&times;</button>
                      <img src={fullImage} className="w-auto h-auto max-w-full max-h-full object-contain rounded-xl shadow-2xl" alt="Full Proof" />
                   </div>
                </div>
            )}
        </div>
    )
}
