import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function MiniCalendar({ onDateSelect, onClose, inline = false, onChange }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [amount, setAmount] = useState('');
    const [selectedDateState, setSelectedDateState] = useState(null);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleAmountChange = (e) => {
        const newAmount = e.target.value;
        setAmount(newAmount);
        if (onChange) {
            onChange({ date: selectedDateState, amount: newAmount });
        }
    };

    const handleDateClick = (day) => {
        const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = selectedDate.toISOString().split('T')[0];
        setSelectedDateState(dateStr);

        if (onDateSelect) {
            onDateSelect({
                date: dateStr,
                amount: amount
            });
        }

        if (onChange) {
            onChange({ date: dateStr, amount: amount });
        }

        if (onClose && !inline) {
            onClose();
        }
    };

    const days = [];
    for (let i = 0; i < firstDayOfMonth(currentDate); i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }
    for (let i = 1; i <= daysInMonth(currentDate); i++) {
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const isToday = new Date().toDateString() === dateObj.toDateString();
        const isSelected = selectedDateState === dateObj.toISOString().split('T')[0];

        days.push(
            <button
                key={i}
                onClick={() => handleDateClick(i)}
                className={clsx(
                    "h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-blue-100",
                    isSelected ? "bg-blue-600 text-white hover:bg-blue-700" :
                        isToday ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-slate-700"
                )}
            >
                {i}
            </button>
        );
    }

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    const content = (
        <div className={clsx(
            "bg-white p-4 w-72",
            inline ? "rounded-none" : "rounded-xl shadow-xl border border-slate-200 absolute bottom-full mb-2 left-1/2 z-50"
        )}>
            {/* Arrow for popover effect - only if NOT inline */}
            {!inline && (
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
            )}

            <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monto a Pagar</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                    <ChevronLeft size={20} />
                </button>
                <span className="font-bold text-slate-800">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                    <span key={`${d}-${i}`} className="text-xs font-bold text-slate-400">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 place-items-center">
                {days}
            </div>
        </div>
    );

    if (inline) {
        return content;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 10, x: "-50%" }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-1/2 z-50"
        >
            {content}
        </motion.div>
    );
}
