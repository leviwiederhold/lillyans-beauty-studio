insert into public.memberships (name, plan_name, price_label, perks, status, is_featured, is_active, sort_order)
values
  (
    'Glow',
    'Glow',
    '$60/month',
    'Choose 1 monthly: signature facial or brow tint & lami or lash lift & tint. Includes 10% off services & retail, priority booking, and a free birthday add-on!',
    'plan',
    false,
    true,
    10
  ),
  (
    'Radiance',
    'Radiance',
    '$130/month',
    'BEST VALUE. Choose 2 monthly: customized facial plus brow or lash lift & tint every 6–8 weeks, rotated as needed. Includes 15% off services & retail, priority booking, and an upgraded birthday gift!',
    'plan',
    true,
    true,
    20
  ),
  (
    'Luminary',
    'Luminary',
    '$200/month',
    'Monthly premium facial + add-on, brow and lash lift & tint every 6–8 weeks, rotated as needed, up to $75/month in waxing, 20% off services & retail, priority booking, and a premium birthday gift!',
    'plan',
    false,
    true,
    30
  )
on conflict do nothing;
