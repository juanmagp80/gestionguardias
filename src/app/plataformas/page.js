'use client';

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../../../lib/supabaseClient';

const OrderPage = () => {
    const [date, setDate] = useState(new Date());
    const [orderNumber, setOrderNumber] = useState('');
    const [orders, setOrders] = useState([]);

    // Maneja la inserción de una nueva orden
    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('orders')
            .insert([{ date, order_number: orderNumber }]);

        if (error) {
            console.error('Error saving order:', error);
        } else {
            console.log('Order saved:', data);
            fetchOrders(); // Actualiza la lista de órdenes después de insertar
        }
    };

    // Obtiene las órdenes desde Supabase
    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching orders:', error);
        } else {
            setOrders(data);
        }
    };

    // Agrupa las órdenes por semana
    const groupOrdersByWeek = () => {
        const weeks = {};
        const currentWeek = getWeekNumber(new Date());

        orders.forEach((order) => {
            const orderDate = new Date(order.date);
            const orderWeek = getWeekNumber(orderDate);

            // Solo incluir semanas que no hayan pasado
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

    // Obtiene el número de semana de una fecha
    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
        return weekNo;
    };

    // Ejecuta fetchOrders cuando el componente se monta
    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div style={styles.container}>
            <h1 style={styles.heading}>Gestión de Órdenes</h1>

            {/* Formulario para seleccionar fecha y número de orden */}
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.calendarContainer}>
                    <Calendar onChange={setDate} value={date} />
                </div>
                <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Número de orden"
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>Guardar orden</button>
            </form>

            {/* Mostrar órdenes agrupadas por semana */}
            <h2 style={styles.subHeading}>Órdenes por Semana</h2>
            {Object.entries(groupOrdersByWeek()).map(([week, ordersInWeek]) => (
                <div key={week} style={styles.weekContainer}>
                    <h3 style={styles.weekHeading}>Semana: {week}</h3>
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

export default OrderPage;

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f7f7f7',
        borderRadius: '8px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
    },
    heading: {
        textAlign: 'center',
        fontSize: '2rem',
        color: '#333',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '40px',
    },
    calendarContainer: {
        marginBottom: '20px',
    },
    input: {
        width: '100%',
        maxWidth: '300px',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '1rem',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    subHeading: {
        fontSize: '1.5rem',
        color: '#333',
        marginBottom: '20px',
    },
    weekContainer: {
        backgroundColor: '#fff',
        padding: '10px',
        borderRadius: '6px',
        boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px',
    },
    weekHeading: {
        fontSize: '1.2rem',
        color: '#007bff',
        marginBottom: '10px',
    },
    orderList: {
        listStyleType: 'none',
        paddingLeft: '0',
    },
    orderItem: {
        padding: '8px 0',
        borderBottom: '1px solid #eee',
        fontSize: '1rem',
    },
};
