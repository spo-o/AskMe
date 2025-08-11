import { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import { supabaseAdmin } from '../../services/supabaseClient';

dotenv.config();

const router = Router();

router.get('/check-payment-status/:requestId', async (req: Request, res: Response): Promise<void> => {
    const { requestId } = req.params;

    if (!requestId) {
        res.status(400).json({ error: 'Request ID is required.' });
        return
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('custom_property_requests')
            .select('payment_status')
            .eq('id', requestId)
            .single();

        if (error) {
            console.error('Supabase error checking payment status:', error);
            res.status(500).json({ error: 'Failed to retrieve payment status.' });
            return
        }

        if (!data) {
            res.status(404).json({ error: 'Request with provided ID not found.' });
            return
        }

        res.json({ paymentStatus: data.payment_status });
    } catch (err) {
        console.error('Server error checking payment status:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;