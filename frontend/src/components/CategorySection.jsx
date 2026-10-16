
import { Link } from 'react-router-dom'
import { categories } from '../data/mockProducts'
import SectionHeading from './SectionHeading'

function CategorySection() {
  return (
    <section
      id="categories"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <SectionHeading
        eyebrow="Explore our world"
        title="Shop by Category"
        description="Something beautiful for every corner and occasion."
        actionLabel="Explore all"
        actionHref="/shop"
      />

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/shop?category=${encodeURIComponent(category.name)}`}
            className="group"
            aria-label={`Explore ${category.name}`}
          >
            <div className="overflow-hidden rounded-2xl bg-ivory">
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                className="h-44 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64"
              />
            </div>

            <h3 className="mt-4 font-display text-lg text-burgundy transition group-hover:text-maroon sm:text-xl">
              {category.name}
            </h3>

            <p className="mt-1 text-xs leading-5 text-burgundy/65 sm:text-sm">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default CategorySection
