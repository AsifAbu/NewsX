import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const categories = await Promise.all(
    [
      "Bangladesh",
      "Politics",
      "International",
      "Business",
      "Opinion",
      "Sports",
      "Entertainment",
      "Jobs",
      "Lifestyle",
      "Technology",
    ].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  const [, politics, , business, , sports, entertainment, , , technology] = categories;

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@newsx.test" },
    update: {},
    create: { name: "Admin User", email: "admin@newsx.test", passwordHash, role: "ADMIN" },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@newsx.test" },
    update: {},
    create: { name: "Mod Rahman", email: "moderator@newsx.test", passwordHash, role: "MODERATOR" },
  });

  const reader = await prisma.user.upsert({
    where: { email: "reader@newsx.test" },
    update: {},
    create: { name: "Reader Khan", email: "reader@newsx.test", passwordHash, role: "USER" },
  });

  const published = [
    {
      title: "Parliament passes new digital infrastructure bill",
      categoryId: politics.id,
      authorId: admin.id,
      body: "Lawmakers approved a sweeping bill today aimed at expanding broadband access nationwide. The bill allocates funding for rural connectivity and sets new data protection standards for telecom operators.\n\nSupporters say the measure will close the digital divide within five years, while critics argue the timeline is unrealistic without further private investment.",
      imageUrl: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200",
      viewCount: 482,
      daysAgo: 0,
    },
    {
      title: "Local club clinches championship after dramatic final",
      categoryId: sports.id,
      authorId: moderator.id,
      body: "A last-minute goal sealed the title for the home side in front of a sold-out crowd on Saturday night.\n\nThe win caps a remarkable turnaround for a team that was bottom of the table just two seasons ago.",
      imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200",
      viewCount: 915,
      daysAgo: 1,
    },
    {
      title: "Central bank holds interest rates steady amid inflation concerns",
      categoryId: business.id,
      authorId: admin.id,
      body: "The central bank kept its benchmark rate unchanged for a third consecutive meeting, citing mixed signals on inflation and employment.\n\nAnalysts expect the next move to come only after the upcoming quarterly data release.",
      imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200",
      viewCount: 231,
      daysAgo: 2,
    },
    {
      title: "Startup unveils low-cost solar charging kit for rural homes",
      categoryId: technology.id,
      authorId: moderator.id,
      body: "A local startup has launched an affordable solar charging kit designed for off-grid households, aiming to reach a million homes within two years.\n\nThe kit includes a panel, battery, and three LED lights, and is priced to undercut imported alternatives.",
      imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200",
      viewCount: 1340,
      daysAgo: 3,
    },
    {
      title: "Acclaimed director announces new film set for next year",
      categoryId: entertainment.id,
      authorId: admin.id,
      body: "The award-winning director confirmed production will begin early next year on a long-anticipated project, with casting details expected within weeks.",
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
      viewCount: 657,
      daysAgo: 4,
    },
    {
      title: "City announces new public transit line connecting suburbs",
      categoryId: politics.id,
      authorId: moderator.id,
      body: "City officials unveiled plans for a new transit line expected to cut commute times for over 200,000 residents once complete.\n\nConstruction is slated to begin next quarter, with the first phase opening within three years.",
      imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200",
      viewCount: 128,
      daysAgo: 5,
    },
  ];

  function slugify(title: string, i: number) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + i;
  }

  const createdNews = [];
  for (const [i, n] of published.entries()) {
    const publishedAt = new Date(Date.now() - n.daysAgo * 24 * 60 * 60 * 1000);
    const news = await prisma.news.upsert({
      where: { slug: slugify(n.title, i) },
      update: {},
      create: {
        title: n.title,
        slug: slugify(n.title, i),
        body: n.body,
        imageUrl: n.imageUrl,
        categories: { connect: [{ id: n.categoryId }] },
        authorId: n.authorId,
        status: "PUBLISHED",
        publishedAt,
        viewCount: n.viewCount,
      },
    });
    createdNews.push(news);
  }

  // One pending submission so the Approval List / my-submissions pages have data too
  await prisma.news.upsert({
    where: { slug: "regional-trade-talks-resume-after-pause-99" },
    update: {},
    create: {
      title: "Regional trade talks resume after six-month pause",
      slug: "regional-trade-talks-resume-after-pause-99",
      body: "Negotiators from neighboring countries met today to restart trade talks that stalled earlier this year over tariff disagreements.",
      categories: { connect: [{ id: business.id }] },
      authorId: moderator.id,
      status: "PENDING",
    },
  });

  await prisma.comment.createMany({
    data: [
      { newsId: createdNews[1].id, userId: reader.id, body: "What a match! Saw it live, incredible atmosphere." },
      { newsId: createdNews[3].id, userId: reader.id, body: "Finally something affordable for off-grid areas." },
    ],
  });

  console.log("Seeded:", {
    categories: categories.length,
    users: [admin.email, moderator.email, reader.email],
    news: createdNews.length + 1,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
