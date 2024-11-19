// styles.js
export const styles = {
    container: {
        maxWidth: '800px',
        margin: '2rem auto',
        padding: '2rem',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        backgroundColor: '#1f2937', // Fondo oscuro
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
    heading: {
        textAlign: 'center',
        fontSize: '2.5rem',
        color: '#ffffff', // Texto blanco
        marginBottom: '2rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '3rem',
        padding: '2rem',
        backgroundColor: '#374151', // Gris oscuro
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        gap: '1rem',
        marginBottom: '2rem',
    },
    calendarContainer: {
        marginBottom: '2rem',
        padding: '1rem',
        backgroundColor: '#374151', // Gris oscuro
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    },
    input: {
        width: '100%',
        maxWidth: '300px',
        padding: '12px 16px',
        backgroundColor: '#4B5563', // Gris más claro
        color: '#ffffff',
        border: '2px solid #6B7280',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        fontSize: '1rem',
        transition: 'all 0.3s ease',
        outline: 'none',
    },
    button: {
        padding: '12px 24px',
        background: 'linear-gradient(to right, #EF4444, #DC2626)', // Gradiente rojo
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        outline: 'none',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    },
    subHeading: {
        fontSize: '1.8rem',
        color: '#ffffff',
        marginBottom: '1.5rem',
        fontWeight: '600',
        borderBottom: '2px solid #4B5563',
        paddingBottom: '0.5rem',
    },
    // Actualizar en styles.js
    weekContainer: {
        backgroundColor: '#374151', // Fondo oscuro para coincidir con el tema
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
        marginBottom: '1.5rem',
        transition: 'all 0.3s ease',
        border: '1px solid #4B5563',
    },
    weekHeading: {
        fontSize: '1.3rem',
        color: '#ffffff', // Texto blanco para mejor contraste
        marginBottom: '1rem',
        fontWeight: '600',
    },
    orderList: {
        listStyleType: 'none',
        paddingLeft: '0',
    },
    orderItem: {
        padding: '1rem',
        borderBottom: '1px solid #4B5563',
        fontSize: '1rem',
        color: '#ffffff', // Texto blanco para mejor contraste
        transition: 'background-color 0.2s ease',
        '&:last-child': {
            borderBottom: 'none',
        },
    },
    orderItem: {
        padding: '1rem',
        borderBottom: '1px solid #4B5563',
        fontSize: '1rem',
        color: 'black', // Texto gris claro
        transition: 'background-color 0.2s ease',
    },
    notificationContainer: {
        backgroundColor: '#374151',
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 2px 12px rgba(239, 68, 68, 0.2)',
        marginBottom: '2rem',
        border: '1px solid #EF4444',
    },
    notificationHeading: {
        fontSize: '1.5rem',
        color: '#EF4444', // Rojo
        marginBottom: '1rem',
        fontWeight: '600',
    },
    notificationList: {
        listStyleType: 'none',
        paddingLeft: '0',
    },
    notificationItem: {
        padding: '1rem',
        borderBottom: '1px solid #4B5563',
        fontSize: '1rem',
        color: '#EF4444', // Rojo
        transition: 'background-color 0.2s ease',
    },
};