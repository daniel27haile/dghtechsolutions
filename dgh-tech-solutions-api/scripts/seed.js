require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const AdminUser = require('../models/AdminUser');
const Project = require('../models/Project');
const Service = require('../models/Service');
const SiteContent = require('../models/SiteContent');

const seed = async () => {
  await connectDB();
  console.log('Seeding database...');

  // Clear existing data
  await Promise.all([
    AdminUser.deleteMany({}),
    Project.deleteMany({}),
    Service.deleteMany({}),
    SiteContent.deleteMany({}),
  ]);
  console.log('Cleared existing data.');

  // --- Admin User ---
  await AdminUser.create({
    username: 'daniel',
    email: 'daniel@dghtechsolutions.com',
    password: 'Admin@2024!',
    fullName: 'Daniel Getahun Haile',
    role: 'superadmin',
  });
  console.log('Admin user created: daniel / Admin@2024!');

  // --- Services ---
  await Service.insertMany([
    {
      title: 'Web Development',
      shortDescription: 'Full-stack web applications built with modern frameworks and best practices.',
      fullDescription:
        'We design and develop responsive, performant web applications using React, Angular, Next.js, Node.js, and more. From MVPs to enterprise-scale products.',
      icon: 'globe',
      features: ['React / Angular / Next.js', 'Node.js & Express APIs', 'Database design', 'Cloud deployment'],
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'Mobile App Development',
      shortDescription: 'Cross-platform and native mobile apps for iOS and Android.',
      fullDescription:
        'We build high-performance mobile applications using React Native and Flutter, delivering seamless user experiences across both platforms.',
      icon: 'smartphone',
      features: ['React Native', 'Flutter', 'iOS & Android', 'App Store deployment'],
      isActive: true,
      sortOrder: 2,
    },
    {
      title: 'UI/UX Design',
      shortDescription: 'User-centered design that converts visitors into loyal customers.',
      fullDescription:
        'From wireframes to polished interfaces, we craft digital experiences that are intuitive, accessible, and aligned with your brand identity.',
      icon: 'layout',
      features: ['Figma prototyping', 'Wireframing', 'Brand identity', 'Accessibility audit'],
      isActive: true,
      sortOrder: 3,
    },
    {
      title: 'Cloud Solutions',
      shortDescription: 'Scalable cloud infrastructure on AWS, GCP, and Azure.',
      fullDescription:
        'We architect, deploy, and manage cloud infrastructure that scales with your business — from CI/CD pipelines to Kubernetes clusters.',
      icon: 'cloud',
      features: ['AWS / GCP / Azure', 'Docker & Kubernetes', 'CI/CD pipelines', 'Infrastructure as Code'],
      isActive: true,
      sortOrder: 4,
    },
    {
      title: 'E-Commerce Solutions',
      shortDescription: 'Online stores that drive sales with seamless shopping experiences.',
      fullDescription:
        'We build custom e-commerce platforms and integrate with Shopify, WooCommerce, and headless commerce solutions to power your online business.',
      icon: 'shopping-cart',
      features: ['Custom storefronts', 'Payment gateway integration', 'Inventory management', 'Analytics'],
      isActive: true,
      sortOrder: 5,
    },
    {
      title: 'API Integration',
      shortDescription: 'Connect your systems with third-party services and internal APIs.',
      fullDescription:
        'We design robust REST and GraphQL APIs, and integrate with third-party services like Stripe, Twilio, Salesforce, and dozens of others.',
      icon: 'zap',
      features: ['REST & GraphQL APIs', 'Third-party integrations', 'Webhooks', 'API documentation'],
      isActive: true,
      sortOrder: 6,
    },
  ]);
  console.log('Services seeded.');

  // --- Projects ---
  await Project.insertMany([
    {
      title: 'SerCommerce Platform',
      shortDescription: 'A modern affiliate commerce platform with real-time deal scoring and multi-provider product sync.',
      fullDescription:
        'Full-stack Next.js 16 platform with Amazon, eBay, and Walmart affiliate integrations, deal scoring algorithms, and a powerful admin panel.',
      category: 'E-Commerce',
      techStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'MongoDB', 'REST API'],
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
      liveUrl: 'https://sercommerce.com',
      githubUrl: '',
      isPublished: true,
      isFeatured: true,
      sortOrder: 1,
      client: 'Serk Technologies',
    },
    {
      title: 'DGH Tech Solutions Website',
      shortDescription: 'Corporate website for DGH Tech Solutions with admin dashboard and visitor analytics.',
      fullDescription:
        'Production-ready Angular 18 + Node.js + MongoDB website with project showcase, contact form, and full admin panel.',
      category: 'Web Development',
      techStack: ['Angular 18', 'Node.js', 'Express', 'MongoDB', 'SCSS'],
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      liveUrl: 'https://dghtechsolutions.com',
      githubUrl: '',
      isPublished: true,
      isFeatured: true,
      sortOrder: 2,
      client: 'DGH Tech Solutions',
    },
    {
      title: 'HR Management System',
      shortDescription: 'Full-featured HR platform with employee management, payroll, and attendance tracking.',
      fullDescription:
        'Enterprise HR solution built with Angular and Spring Boot, supporting multi-department workflows, leave management, and reporting.',
      category: 'SaaS',
      techStack: ['Angular', 'Spring Boot', 'PostgreSQL', 'Docker'],
      imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
      liveUrl: '',
      githubUrl: '',
      isPublished: true,
      isFeatured: false,
      sortOrder: 3,
      client: 'Enterprise Client',
    },
    {
      title: 'Real Estate Listing App',
      shortDescription: 'Property discovery platform with map integration, saved searches, and mortgage calculator.',
      fullDescription:
        'A React Native mobile app and React web portal for browsing, filtering, and contacting agents about property listings.',
      category: 'Mobile App',
      techStack: ['React Native', 'React', 'Node.js', 'MongoDB', 'Google Maps API'],
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      liveUrl: '',
      githubUrl: '',
      isPublished: true,
      isFeatured: false,
      sortOrder: 4,
      client: 'Real Estate Agency',
    },
  ]);
  console.log('Projects seeded.');

  // --- Site Content ---
  await SiteContent.insertMany([
    {
      key: 'hero',
      data: {
        headline: 'Building Digital Solutions That Drive Growth',
        subheadline: 'DGH Tech Solutions delivers world-class web development, mobile apps, and cloud services tailored for modern businesses.',
        ctaPrimary: { text: 'View Our Work', link: '/projects' },
        ctaSecondary: { text: 'Get a Free Quote', link: '/contact' },
        badge: 'Trusted Technology Partner',
      },
    },
    {
      key: 'about',
      data: {
        tagline: 'Who We Are',
        headline: 'Passionate Engineers. Driven by Results.',
        bio: 'DGH Tech Solutions was founded by Daniel Getahun Haile with a mission to deliver high-quality, scalable technology solutions for businesses of all sizes. We combine deep technical expertise with a passion for clean code and great user experiences.',
        founderName: 'Daniel Getahun Haile',
        founderTitle: 'Founder & Lead Engineer',
        founderImage: '',
        yearsExperience: '5+',
        projectsCompleted: '20+',
        happyClients: '15+',
        techStack: ['Angular', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker'],
        values: [
          { title: 'Quality First', description: 'We never ship code we are not proud of.' },
          { title: 'Transparency', description: 'Clear communication at every stage of the project.' },
          { title: 'Scalability', description: 'Architecture built to grow with your business.' },
        ],
      },
    },
    {
      key: 'cta',
      data: {
        headline: 'Ready to Build Something Great?',
        subheadline: 'Let\'s discuss your project and find the best solution for your business needs.',
        buttonText: 'Start Your Project',
        buttonLink: '/contact',
        secondaryText: 'Or view our services',
        secondaryLink: '/services',
      },
    },
    {
      key: 'settings',
      data: {
        businessName: 'DGH TECH SOLUTIONS',
        logoText: 'DGH',
        tagline: 'Building Tomorrow\'s Technology Today',
        email: 'info@dghtechsolutions.com',
        phone: '+1 (555) 123-4567',
        address: 'United States',
        website: 'https://dghtechsolutions.com',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/danielgetahunhaile',
          github: 'https://github.com/dghtechsolutions',
          twitter: '',
          facebook: '',
          instagram: '',
        },
        footerText: '© 2026 DGH Tech Solutions. All rights reserved.',
        metaDescription: 'DGH Tech Solutions — Professional web development, mobile apps, and cloud solutions.',
        metaKeywords: 'web development, mobile apps, cloud solutions, Angular, React, Node.js',
      },
    },
    {
      key: 'contact_info',
      data: {
        headline: 'Get In Touch',
        subheadline: 'Have a project in mind? We would love to hear from you. Send us a message and we will get back to you within 24 hours.',
        email: 'info@dghtechsolutions.com',
        phone: '+1 (555) 123-4567',
        address: 'United States (Remote)',
        availabilityNote: 'Available Monday–Friday, 9am–6pm EST',
        mapEmbedUrl: '',
      },
    },
  ]);
  console.log('Site content seeded.');

  console.log('\n--- Seed complete ---');
  console.log('Admin login: daniel / Admin@2024!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
