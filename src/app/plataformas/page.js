'use client';

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';
import "./styles.css";
import { styles } from './styles.js';

const OrderPage = () => {
    const [date, setDate] = useState(new Date());
    const [orderNumber, setOrderNumber] = useState('');
    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();

        const utcDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0, 0, 0, 0
        ));

        const { data, error } = await supabase
            .from('orders')
            .insert([{
                date: utcDate.toISOString().split('T')[0],
                order_number: orderNumber
            }])
            .select();

        if (error) {
            console.error('Error guardando orden:', error);
            setSuccessMessage('Error al guardar la orden');
        } else {
            console.log('Orden guardada:', data);
            fetchOrders();
            setOrderNumber('');
            setSuccessMessage('Orden guardada correctamente'); // Añadir mensaje de éxito

            // Limpiar mensaje después de 3 segundos
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        }
    };

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

    const groupOrdersByWeek = () => {
        const weeks = {};
        const currentWeek = getWeekNumber(new Date());

        orders.forEach((order) => {
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
        return weeks;
    };

    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        return weekNo;
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

    const handleCheckNotifications = () => {
        checkNotifications();
    };

    const sendTelegramNotification = async (order) => {
        const botToken = '7584979783:AAEfvF3Cmf8lHWd25j9M6bo5XXT8ryPPZYA';
        const chatId = '-439505742';
        const message = `La orden #${order.order_number} está programada para instalarse en 4 días o menos, con plataforma.`;

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

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div style={styles.container}>
            <h1 className='font-dosis' style={styles.heading}>Órdenes con plataforma</h1>

            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.calendarContainer}>
                    <Calendar
                        onChange={setDate}
                        value={date}
                        locale="es-ES"
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
                    onClick={handleCheckNotifications}
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
                    <h3 className='font-dosis'
                        style={styles.weekHeading}>Semana: {week}</h3>
                    <ul style={styles.orderList}>
                        {ordersInWeek.map((order) => (
                            <li key={order.id} style={styles.orderItem}>
                                {new Date(order.date).toLocaleDateString()} - Orden #{order.order_number}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

// Actualizar el objeto styles con estos nuevos estilos:


export default OrderPage;