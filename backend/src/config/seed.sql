
-- Add product categories
INSERT INTO categories (name, slug, description, image_url)
VALUES
(
    'Rangoli Sheets',
    'rangoli-sheets',
    'Beautiful designs for festive decorations.',
    'https://images.unsplash.com/photo-1606293926075-69a00dbfde81'
),
(
    'Woolen Art',
    'woolen-art',
    'Handcrafted woolen creations.',
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b'
),
(
    'Home Decor',
    'home-decor',
    'Traditional handmade decorations for your home.',
    'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9'
),
(
    'Handmade Gifts',
    'handmade-gifts',
    'Thoughtful handmade gifts for special occasions.',
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f'
)
ON CONFLICT (slug) DO NOTHING;

-- Add sample products
INSERT INTO products (
    category_id,
    name,
    slug,
    description,
    price,
    stock_quantity,
    image_url,
    is_featured
)
VALUES
(
    (SELECT id FROM categories WHERE slug = 'rangoli-sheets'),
    'Traditional Floral Rangoli Sheet',
    'traditional-floral-rangoli-sheet',
    'A decorative rangoli sheet inspired by traditional Indian floral patterns.',
    299.00,
    20,
    'https://images.unsplash.com/photo-1606293926075-69a00dbfde81',
    TRUE
),
(
    (SELECT id FROM categories WHERE slug = 'woolen-art'),
    'Handcrafted Woolen Wall Art',
    'handcrafted-woolen-wall-art',
    'A cozy handcrafted wall decoration made with woolen details.',
    599.00,
    10,
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b',
    TRUE
),
(
    (SELECT id FROM categories WHERE slug = 'home-decor'),
    'Decorative Handmade Home Accent',
    'decorative-handmade-home-accent',
    'A handmade decorative accent to bring warmth to your living space.',
    449.00,
    15,
    'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9',
    TRUE
),
(
    (SELECT id FROM categories WHERE slug = 'handmade-gifts'),
    'Handmade Gift Box',
    'handmade-gift-box',
    'A thoughtfully presented gift box for birthdays and celebrations.',
    349.00,
    12,
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f',
    FALSE
)
ON CONFLICT (slug) DO NOTHING;
