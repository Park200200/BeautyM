const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePortfolioImages() {
  const updates = [
    { id: 'portfolio-sample-1', beforeImage: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&h=500&fit=crop&crop=face', afterImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&crop=face' },
    { id: 'portfolio-sample-2', beforeImage: 'https://images.unsplash.com/photo-1594824476967-48c8b964f137?w=400&h=500&fit=crop&crop=face', afterImage: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&h=500&fit=crop&crop=face' },
    { id: 'portfolio-sample-3', beforeImage: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=500&fit=crop&crop=face', afterImage: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop&crop=face' },
    { id: 'portfolio-sample-4', beforeImage: 'https://images.unsplash.com/photo-1573461160327-b450ce3d8e7f?w=400&h=500&fit=crop&crop=face', afterImage: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&h=500&fit=crop&crop=face' },
    { id: 'portfolio-sample-5', beforeImage: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=500&fit=crop&crop=face', afterImage: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=500&fit=crop&crop=face' },
    { id: 'portfolio-sample-6', beforeImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=400&h=500&fit=crop&crop=face', afterImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&h=500&fit=crop&crop=face' },
  ];

  for (const u of updates) {
    await prisma.portfolio.update({
      where: { id: u.id },
      data: { beforeImage: u.beforeImage, afterImage: u.afterImage },
    });
    console.log(`Updated ${u.id}`);
  }
  console.log('Done!');
  await prisma.$disconnect();
}

updatePortfolioImages();
