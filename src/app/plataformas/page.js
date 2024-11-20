'use client';

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import "./styles.css";
import { styles } from './styles.js';

const OrderPage = () => {
    const [date, setDate] = useState(null);
    const [orderNumber, setOrderNumber] = useState('');
    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [editingOrder, setEditingOrder] = useState(null);
    const [editDate, setEditDate] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error obteniendo órdenes:', error);
        } else {
            setOrders(data || []);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const orderData = {
            order_number: orderNumber || 'Sin número',
            date: date ? new Date(Date.UTC(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                0, 0, 0, 0
            )).toISOString().split('T')[0] : null,
            status: date ? 'programado' : 'no programado'
        };

        const { data, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select();

        if (error) {
            console.error('Error guardando orden:', error);
            setSuccessMessage('Error al guardar la orden');
        } else {
            await fetchOrders();
            setOrderNumber('');
            setDate(null);
            setSuccessMessage('Orden guardada correctamente');

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
    };

    const handleEditClick = (order) => {
        setEditingOrder(order);
        setEditDate(order.date ? new Date(order.date) : new Date());
    };

    const handleUpdateOrder = async () => {
        if (!editDate || !editingOrder) {
            return;
        }

        try {
            const utcDate = new Date(Date.UTC(
                editDate.getFullYear(),
                editDate.getMonth(),
                editDate.getDate()
            ));
            const formattedDate = utcDate.toISOString().split('T')[0];

            const { error: updateError } = await supabase
                .from('orders')
                .update({ date: formattedDate })
                .eq('id', editingOrder.id);

            if (updateError) throw updateError;

            await fetchOrders();
            setSuccessMessage('Orden actualizada correctamente');
            setEditingOrder(null);
        } catch (error) {
            console.error('Error:', error);
            setSuccessMessage('Error al actualizar la orden');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) {
                console.error('Error eliminando orden:', error);
                setSuccessMessage('Error al eliminar la orden');
            } else {
                await fetchOrders();
                setSuccessMessage('Orden eliminada correctamente');
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            }
        }
    };

    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        return weekNo;
    };

    const groupOrdersByWeek = () => {
        const weeks = {};
        const currentWeek = getWeekNumber(new Date());
        const unscheduledOrders = [];

        orders.forEach((order) => {
            if (!order.date) {
                unscheduledOrders.push(order);
                return;
            }

            const orderDate = new Date(order.date);
            const orderWeek = getWeekNumber(orderDate);

            if (orderWeek >= currentWeek) {
                const week = `${orderDate.getFullYear()}-W${orderWeek}`;
                if (!weeks[week]) {
                    weeks[week] = [];
                }
                weeks[week].push(order);
            }
        });

        if (unscheduledOrders.length > 0) {
            weeks['no_programado'] = unscheduledOrders;
        }

        return weeks;
    };

    const checkNotifications = () => {
        const today = new Date();
        const fourDaysFromNow = new Date(today);
        fourDaysFromNow.setDate(today.getDate() + 4);

        const ordersToNotify = orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= today && orderDate <= fourDaysFromNow;
        });

        ordersToNotify.forEach(order => {
            sendTelegramNotification(order);
        });

        setNotifications(ordersToNotify);
    };

    const sendTelegramNotification = async (order) => {
        const botToken = '7584979783:AAEfvF3Cmf8lHWd25j9M6bo5XXT8ryPPZYA';
        const chatId = '-439505742';

        const formattedDate = new Date(order.date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const message = `La orden #${order.order_number} está programada para la fecha ${formattedDate}`;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!data.ok) {
                console.error('Error en la respuesta de Telegram:', data);
            }
        } catch (error) {
            console.error('Error enviando mensaje de Telegram:', error);
        }
    };

    return (
        <div style={styles.container}>
            <h1 className='font-dosis' style={styles.heading}>Órdenes con plataforma</h1>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.calendarContainer}>
                    <Calendar
                        onChange={setDate}
                        value={date}
                        locale="es-ES"
                        selectRange={false}
                        clearIcon={null}
                        onClickDay={(value) => {
                            if (date && value.getTime() === date.getTime()) {
                                setDate(null);
                            } else {
                                setDate(value);
                            }
                        }}
                    />
                </div>
                <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Número de orden"
                    style={styles.input}
                    className='font-dosis'
                />
                <button
                    type="submit"
                    className="button save-button font-dosis"
                    style={styles.button}
                >
                    Guardar orden
                </button>
                {successMessage && (
                    <div className="p-4 bg-gray-700 rounded-lg text-center text-white 
                                border-l-4 border-green-500 shadow-lg animate-fadeIn mt-4">
                        {successMessage}
                    </div>
                )}
            </form>

            <div style={styles.buttonContainer}>
                <button
                    onClick={checkNotifications}
                    className="button check-button font-dosis"
                    style={{ ...styles.button, backgroundColor: '#28a745' }}
                >
                    Consultar ordenes cercanas y enviar a Telegram
                </button>
            </div>

            {notifications.length > 0 && (
                <div style={styles.notificationContainer}>
                    <h2 style={styles.notificationHeading}>Notificaciones</h2>
                    <ul style={styles.notificationList}>
                        {notifications.map((order) => (
                            <li key={order.id} style={styles.notificationItem}>
                                La orden #{order.order_number} está programada para instalarse en 4 días o menos.
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <h2 className="pt-8 font-dosis" style={styles.subHeading}>Órdenes por Semana</h2>
            {Object.entries(groupOrdersByWeek()).map(([week, ordersInWeek]) => (
                <div key={week} style={styles.weekContainer}>
                    <h3 className='font-dosis' style={styles.weekHeading}>
                        {week === 'no_programado' ? 'No Programadas' : `Semana: ${week}`}
                    </h3>
                    <ul style={styles.orderList}>
                        {ordersInWeek.map((order) => (
                            <li key={order.id} style={styles.orderItem}>
                                {order.date ?
                                    new Date(order.date).toLocaleDateString() :
                                    'No programado'
                                } - Orden #{order.order_number}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClick(order)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteOrder(order.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}

            {editingOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg text-white">
                        <h3 className="font-dosis mb-4">
                            Editar Orden #{editingOrder.order_number}
                        </h3>
                        <div className="mb-4 calendar-container">
                            <Calendar
                                onChange={setEditDate}
                                value={editDate || new Date()}
                                locale="es-ES"
                                className="dark-calendar"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditingOrder(null)}
                                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateOrder}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Guardar cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderPage;