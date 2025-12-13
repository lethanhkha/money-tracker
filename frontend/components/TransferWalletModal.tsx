"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Wallet } from "@/lib/types";

interface TransferWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        fromWalletId: string;
        toWalletId: string;
        amount: number;
        description?: string;
    }) => void;
    wallets: Wallet[];
    isLoading?: boolean;
}

export default function TransferWalletModal({
    isOpen,
    onClose,
    onSubmit,
    wallets,
    isLoading = false,
}: TransferWalletModalProps) {
    const [formData, setFormData] = useState({
        fromWalletId: "",
        toWalletId: "",
        amount: "",
        description: "",
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                fromWalletId: wallets[0]?.id || "",
                toWalletId: wallets[1]?.id || "",
                amount: "",
                description: "",
            });
        }
    }, [isOpen, wallets]);

    const fromWallet = wallets.find((w) => w.id === formData.fromWalletId);
    const availableToWallets = wallets.filter(
        (w) => w.id !== formData.fromWalletId
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate from wallet
        if (!formData.fromWalletId) {
            toast.error("Vui lòng chọn ví nguồn");
            return;
        }

        // Validate to wallet
        if (!formData.toWalletId) {
            toast.error("Vui lòng chọn ví đích");
            return;
        }

        // Validate same wallet
        if (formData.fromWalletId === formData.toWalletId) {
            toast.error("Ví nguồn và ví đích phải khác nhau");
            return;
        }

        // Validate amount
        const amountValue = parseFloat(formData.amount);
        if (!formData.amount || isNaN(amountValue)) {
            toast.error("Vui lòng nhập số tiền");
            return;
        }

        if (amountValue <= 0) {
            toast.error("Số tiền phải lớn hơn 0");
            return;
        }

        if (fromWallet && amountValue > fromWallet.balance) {
            toast.error("Số tiền vượt quá số dư ví nguồn");
            return;
        }

        onSubmit({
            fromWalletId: formData.fromWalletId,
            toWalletId: formData.toWalletId,
            amount: amountValue,
            description: formData.description || undefined,
        });
    };

    // Handle from wallet change - reset to wallet if same
    const handleFromWalletChange = (newFromWalletId: string) => {
        setFormData((prev) => ({
            ...prev,
            fromWalletId: newFromWalletId,
            toWalletId:
                prev.toWalletId === newFromWalletId ? "" : prev.toWalletId,
        }));
    };

    if (wallets.length < 2) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Chuyển tiền">
                <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                        Bạn cần có ít nhất 2 ví để thực hiện chuyển tiền.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                        Đóng
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chuyển tiền giữa các ví">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* From Wallet */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Từ ví <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.fromWalletId}
                        onChange={(e) => handleFromWalletChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    >
                        {wallets.map((wallet) => (
                            <option key={wallet.id} value={wallet.id}>
                                {wallet.icon} {wallet.name} - {formatCurrency(wallet.balance)}
                            </option>
                        ))}
                    </select>
                    {fromWallet && (
                        <p className="mt-1 text-sm text-gray-500">
                            Số dư hiện tại: {formatCurrency(fromWallet.balance)}
                        </p>
                    )}
                </div>

                {/* Arrow indicator */}
                <div className="flex justify-center">
                    <div className="p-2 bg-indigo-100 rounded-full">
                        <ArrowRight className="w-5 h-5 text-indigo-600" />
                    </div>
                </div>

                {/* To Wallet */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đến ví <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.toWalletId}
                        onChange={(e) =>
                            setFormData({ ...formData, toWalletId: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
                    >
                        <option value="">-- Chọn ví đích --</option>
                        {availableToWallets.map((wallet) => (
                            <option key={wallet.id} value={wallet.id}>
                                {wallet.icon} {wallet.name} - {formatCurrency(wallet.balance)}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số tiền <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) =>
                            setFormData({ ...formData, amount: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Nhập số tiền cần chuyển"
                        step="1000"
                        min="0"
                        max={fromWallet?.balance}
                    />
                    {fromWallet && formData.amount && (
                        <p className="mt-1 text-sm text-gray-500">
                            Số dư sau chuyển:{" "}
                            {formatCurrency(
                                fromWallet.balance - (parseFloat(formData.amount) || 0)
                            )}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ghi chú (tùy chọn)
                    </label>
                    <input
                        type="text"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Ví dụ: Chuyển tiền tiết kiệm"
                    />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang chuyển...
                            </>
                        ) : (
                            "Chuyển tiền"
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
