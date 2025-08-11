import express, { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../services/supabaseClient';
import { CustomPropertyType } from '../../types';

const router = express.Router();

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    first_name, last_name, email, phone,
    entity_type, company_name, experience_level,
    address, sqft, year_built, current_use,
    ownership_status, intended_use, timeline,
    help_level, description, selectedPackage, payment_status,
  } = req.body;

  const newProperty: CustomPropertyType = {
    first_name,
    last_name,
    email,
    phone,
    entity_type,
    company_name,
    experience_level,
    address,
    sqft,
    year_built,
    current_use,
    ownership_status,
    intended_use,
    timeline,
    help_level,
    description,
    selected_package: selectedPackage,
    payment_status: 'pending'
  }

  const { data, error } = await supabaseAdmin
  .from('custom_property_requests')
  .insert([newProperty])
  .select('id')
  .single();

  if (error) {
    console.error('[Supabase Insert Error]', error);
    res.status(500).json({ error: error.message });
  }

  if (!data) {
    res.status(500).json({ error: 'Failed to insert property' });
    return;
  }
  
  res.status(200).json({ id: data.id });
  
});

export default router;
