import prisma from "../../src/lib/utils/prisma";
import bcrypt from "bcryptjs";

function parseSlug(text: string) {
  return text
    .toLowerCase() // Convert to lowercase
    .trim() // Remove leading and trailing whitespace
    .normalize("NFD") // Normalize to decompose accents
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters (except spaces and hyphens)
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with a single hyphen
}

const permissionList = [
  "view-dashboard",

  "create-article",
  "delete-article",
  "detail-article",
  "view-article",
  "update-article",

  "create-articleCategory",
  "delete-articleCategory",
  "detail-articleCategory",
  "view-articleCategory",
  "update-articleCategory",

  "create-calculatorDetailField",
  "delete-calculatorDetailField",
  "view-calculatorDetailField",
  "update-calculatorDetailField",

  "create-calculatorField",
  "delete-calculatorField",
  "view-calculatorField",
  "update-calculatorField",

  "create-calculatorType",
  "delete-calculatorType",
  "detail-calculatorType",
  "view-calculatorType",
  "update-calculatorType",

  "view-companyProfile",
  "update-companyProfile",

  "create-formField",
  "delete-formField",
  "view-formField",
  "update-formField",

  "delete-formSubmission",
  "detail-formSubmission",
  "view-formSubmission",

  "create-formType",
  "delete-formType",
  "detail-formType",
  "view-formType",
  "update-formType",

  "create-menuItem",
  "delete-menuItem",
  "detail-menuItem",
  "view-website",
  "view-menuItem",
  "update-menuItem",

  "create-page",
  "delete-page",
  "view-page",

  "view-permission",

  "create-role",
  "delete-role",
  "detail-role",
  "view-role",
  "update-role",

  "create-roleGroup",
  "delete-roleGroup",
  "detail-roleGroup",
  "view-roleGroup",
  "update-roleGroup",

  "create-section",
  "delete-section",
  "view-section",
  "update-section",

  "create-user",
  "delete-user",
  "detail-user",
  "view-user",
  "update-user",

  "view-collection",
  "update-collection",

  "list-mappingPermissionRole",
  "toggle-mappingPermissionRole",

  "list-mappingRoleFormType",
  "toggle-mappingRoleFormType",

  "list-mappingRoleMenuItem",
  "toggle-mappingRoleMenuItem",

  "list-mappingRoleArticleCategory",
  "toggle-mappingRoleArticleCategory",

  "verify-page",
  "verify-article"
];

const main = async () => {
  try {
    const passwordBackfillUsers = await prisma.user.findMany({
      where: {
        password: {
          not: null,
        },
        authAccounts: {
          none: {
            providerId: 'credential',
          },
        },
      },
      select: {
        id: true,
        password: true,
      },
    });

    for (const user of passwordBackfillUsers) {
      if (!user.password) continue;

      await prisma.authAccount.create({
        data: {
          id: user.id,
          accountId: String(user.id),
          providerId: 'credential',
          userId: user.id,
          password: user.password,
        },
      });
    }

    await prisma.permission.createMany({
      data: permissionList.map((permission) => {
        const splittedPermission = permission.split("-");
        return {
          code: permission,
          name: splittedPermission.join(" "),
          description: `Melakukan ${splittedPermission[0]} terhadap ${splittedPermission[1]}`,
        };
      }),
      skipDuplicates: true,
    });

    await prisma.collection.createMany({
      data: [
        {
          name: 'Kategori Proyek',
          code: 'project-category',
          data: [{"code":"apartment","name_en":"Apartment","name_id":"Apartemen"},{"code":"residential-housing","name_en":"Residential Housing","name_id":"Perumahan"},{"code":"hotel","name_en":"Hotel","name_id":"Hotel"},{"code":"property-management","name_en":"Building/Estate Management","name_id":"Building/Estate Management"},{"code":"rest-area","name_en":"Service Area","name_id":"Rest Area"}]
        },
        {
          name: 'Lokasi Proyek',
          code: 'project-location',
          data: [{"code":"jakarta","name":"Jakarta"},{"code":"tangerang","name":"Tangerang"},{"code":"depok","name":"Depok"},{"code":"semarang","name":"Semarang"}]
        }
      ],
      skipDuplicates: true,
    })

    const hasExistingSeedData = (await prisma.menuItem.count()) > 0 || (await prisma.roleGroup.count()) > 0;

    if (hasExistingSeedData) {
      console.log('Seed skipped: database already contains base content. Applied idempotent auth/permission backfills only.');
      return;
    }

    const developerGroup = await prisma.roleGroup.create({
      data: {
        name: "Developer",
      },
    });

    const adminGroup = await prisma.roleGroup.create({
      data: {
        name: "Admin",
      },
    });

    const developerRole = await prisma.role.create({
      data: {
        name: "Developer",
        role_group_id: developerGroup.id,
        permissions: {
          create: [],
        },
      },
    });

    const passwordHash = await bcrypt.hash("devcid", 10);

    const superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "dev@local.test",
        password: passwordHash,
        emailVerified: true,
        role_id: developerRole.id,
      },
    });

    await prisma.authAccount.create({
      data: {
        id: superAdmin.id,
        accountId: String(superAdmin.id),
        providerId: 'credential',
        userId: superAdmin.id,
        password: passwordHash,
      },
    });

    const companyProfile = await prisma.companyProfile.create({
      data: {
        name: "HK Realtindo",
        slogan: "Membangun Properti Untuk Negeri",
        address:
          "HK TOWER Lantai 17 Jl. Letjen M.T Haryono Kav 8, Cawang. Jakarta Timur 13340",
        email: "corporate@hkrealtindo.com",
        phone: "(021)-8563570",
        facebook: "https://facebook.com/hkrealtindo",
        instagram: "https://instagram.com/hkrealtindo",
        twitter: "https://x.com/hkrealtindo",
        youtube: "https://youtube.com/hkrealtindo",
        whatsapp: "6285635700000",
        linkedin: "https://id.linkedin.com/company/pthkrealtindo",
        subsidiaries: [{"url":"https://www.menaraantam.com/","name":"Menara Antam Sejahtera","type":"external"},{"url":"https://nusapratamaproperty.co.id/","name":"Nusa Pratama Property","type":"external"},{"url":"https://www.wikarealty.co.id/id/subsidiary/SUBS-4422441109165059694","name":"Hotel Karya Indonesia","type":"external"}],
        // product_categories: [{"url":"https://www.menaraantam.com/","name":"Menara Antam Sejahtera","type":"external"},{"url":"https://nusapratamaproperty.co.id/","name":"Nusa Pratama Property","type":"external"},{"url":"https://www.wikarealty.co.id/id/subsidiary/SUBS-4422441109165059694","name":"Hotel Karya Indonesia","type":"external"}]
      },
    });

    const article = await prisma.articleCategory.create({
      data: {
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Artikel",
              },
              {
                language: "en",
                name: "Article",
              },
            ],
          },
        },
      },
    });

    const pressRelease = await prisma.articleCategory.create({
      data: {
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Publikasi",
              },
              {
                language: "en",
                name: "Press Release",
              },
            ],
          },
        },
      },
    });

    const event = await prisma.articleCategory.create({
      data: {
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Acara",
              },
              {
                language: "en",
                name: "Event",
              },
            ],
          },
        },
      },
    });

    const promotion = await prisma.articleCategory.create({
      data: {
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Promosi",
              },
              {
                language: "en",
                name: "Promotion",
              },
            ],
          },
        },
      },
    });

    const beranda = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("Beranda"),
        order: 1,
        role: "home",
        visible: false,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Beranda",
              },
              {
                language: "en",
                name: "Home",
              },
            ],
          },
        },
      },
    });
    const tentangKami = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("Tentang Kami"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Tentang Kami",
              },
              {
                language: "en",
                name: "About Us",
              },
            ],
          },
        },
      },
    });
    const proyek = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("Proyek"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Proyek",
              },
              {
                language: "en",
                name: "Projects",
              },
            ],
          },
        },
      },
    });
    const hubunganInvestor = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("Hubungan Investor"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Hubungan Investor",
              },
              {
                language: "en",
                name: "Investor Relations",
              },
            ],
          },
        },
      },
    });
    const gcg = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("GCG"),
        order: 5,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "GCG",
              },
              {
                language: "en",
                name: "GCG",
              },
            ],
          },
        },
      },
    });
    const media = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("Media"),
        order: 6,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Media",
              },
              {
                language: "en",
                name: "Media",
              },
            ],
          },
        },
      },
    });
    const csr = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("CSR"),
        order: 7,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "CSR",
              },
              {
                language: "en",
                name: "CSR",
              },
            ],
          },
        },
      },
    });
    const kontak = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("Kontak"),
        order: 8,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Kontak",
              },
              {
                language: "en",
                name: "Contact",
              },
            ],
          },
        },
      },
    });
    const pelaporan = await prisma.menuItem.create({
      data: {
        level: 1,
        slug: parseSlug("Pelaporan"),
        order: 9,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Pelaporan",
              },
              {
                language: "en",
                name: "Reporting",
              },
            ],
          },
        },
      },
    });

    const pesanDirektur = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: tentangKami.id,
        slug: parseSlug("Pesan Direktur"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Pesan Direktur",
              },
              {
                language: "en",
                name: "Message from the Director",
              },
            ],
          },
        },
      },
    });
    const visiMisi = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: tentangKami.id,
        slug: parseSlug("Visi & Misi"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Visi & Misi",
              },
              {
                language: "en",
                name: "Vision & Mission Statement",
              },
            ],
          },
        },
      },
    });
    const pencapaianPerusahaan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: tentangKami.id,
        slug: parseSlug("Pencapaian Perusahaan"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Pencapaian Perusahaan",
              },
              {
                language: "en",
                name: "Achievements",
              },
            ],
          },
        },
      },
    });
    const strukturOrganisasi = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: tentangKami.id,
        slug: parseSlug("Struktur Organisasi"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Struktur Organisasi",
              },
              {
                language: "en",
                name: "Organizational Structure",
              },
            ],
          },
        },
      },
    });
    const manajemen = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: tentangKami.id,
        slug: parseSlug("Manajemen"),
        order: 5,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Manajemen",
              },
              {
                language: "en",
                name: "Management",
              },
            ],
          },
        },
      },
    });
    const anakPerusahaan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: tentangKami.id,
        slug: parseSlug("Anak Perusahaan"),
        order: 6,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Anak Perusahaan",
              },
              {
                language: "en",
                name: "Subsidiaries",
              },
            ],
          },
        },
      },
    });
    const penghargaan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: tentangKami.id,
        slug: parseSlug("Penghargaan"),
        order: 7,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Penghargaan",
              },
              {
                language: "en",
                name: "Awards",
              },
            ],
          },
        },
      },
    });
    const apartemen = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: proyek.id,
        slug: parseSlug("Apartemen"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Apartemen",
              },
              {
                language: "en",
                name: "Apartment",
              },
            ],
          },
        },
      },
    });
    const perumahan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: proyek.id,
        slug: parseSlug("Perumahan"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Perumahan",
              },
              {
                language: "en",
                name: "Housing",
              },
            ],
          },
        },
      },
    });
    const hotel = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: proyek.id,
        slug: parseSlug("Hotel"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Hotel",
              },
              {
                language: "en",
                name: "Hotel",
              },
            ],
          },
        },
      },
    });
    const kantor = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: proyek.id,
        slug: parseSlug("Kantor"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Kantor",
              },
              {
                language: "en",
                name: "Office",
              },
            ],
          },
        },
      },
    });
    const laporanTahunan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: hubunganInvestor.id,
        slug: parseSlug("Laporan Tahunan"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Laporan Tahunan",
              },
              {
                language: "en",
                name: "Annual Report",
              },
            ],
          },
        },
      },
    });
    const presentasiPerusahaan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: hubunganInvestor.id,
        slug: parseSlug("Presentasi Perusahaan"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Presentasi Perusahaan",
              },
              {
                language: "en",
                name: "Company Presentation",
              },
            ],
          },
        },
      },
    });
    const sorotanKeuangan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: hubunganInvestor.id,
        slug: parseSlug("Sorotan Keuangan"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Sorotan Keuangan",
              },
              {
                language: "en",
                name: "Financial Highlights",
              },
            ],
          },
        },
      },
    });
    const laporanKeuangan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: hubunganInvestor.id,
        slug: parseSlug("Laporan Keuangan"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Laporan Keuangan",
              },
              {
                language: "en",
                name: "Financial Reports",
              },
            ],
          },
        },
      },
    });
    const keterbukaanInformasi = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: hubunganInvestor.id,
        slug: parseSlug("Keterbukaan Informasi"),
        order: 5,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Keterbukaan Informasi",
              },
              {
                language: "en",
                name: "Information Disclosure",
              },
            ],
          },
        },
      },
    });
    const informasiTender = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: hubunganInvestor.id,
        slug: parseSlug("Informasi Tender"),
        order: 6,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Informasi Tender",
              },
              {
                language: "en",
                name: "Tender Information",
              },
            ],
          },
        },
      },
    });
    const komitmen = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: gcg.id,
        slug: parseSlug("Komitmen"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Komitmen",
              },
              {
                language: "en",
                name: "Commitment",
              },
            ],
          },
        },
      },
    });
    const strukturGCG = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: gcg.id,
        slug: parseSlug("Struktur GCG"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Struktur GCG",
              },
              {
                language: "en",
                name: "GCG Structure",
              },
            ],
          },
        },
      },
    });
    const panduanGCG = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: gcg.id,
        slug: parseSlug("Panduan GCG"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Panduan GCG",
              },
              {
                language: "en",
                name: "GCG Guidelines",
              },
            ],
          },
        },
      },
    });
    const manajemenRisiko = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: gcg.id,
        slug: parseSlug("Manajemen Risiko"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Manajemen Risiko",
              },
              {
                language: "en",
                name: "Risk Management",
              },
            ],
          },
        },
      },
    });
    const sertifikasiISO = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: gcg.id,
        slug: parseSlug("Sertifikasi ISO"),
        order: 5,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Sertifikasi ISO",
              },
              {
                language: "en",
                name: "ISO Certification",
              },
            ],
          },
        },
      },
    });
    const penilaian = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: gcg.id,
        slug: parseSlug("Penilaian"),
        order: 6,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Penilaian",
              },
              {
                language: "en",
                name: "Assessment",
              },
            ],
          },
        },
      },
    });
    const promosiAcara = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: media.id,
        slug: parseSlug("Promosi & Acara"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Promosi & Acara",
              },
              {
                language: "en",
                name: "Promotions & Events",
              },
            ],
          },
        },
      },
    });
    const publikasi = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: media.id,
        slug: parseSlug("Publikasi"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Publikasi",
              },
              {
                language: "en",
                name: "Publications",
              },
            ],
          },
        },
      },
    });
    const artikel = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: media.id,
        slug: parseSlug("Artikel"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Artikel",
              },
              {
                language: "en",
                name: "Articles",
              },
            ],
          },
        },
      },
    });
    const video = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: media.id,
        slug: parseSlug("Video"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Video",
              },
              {
                language: "en",
                name: "Video",
              },
            ],
          },
        },
      },
    });
    const hackathon = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: media.id,
        slug: parseSlug("Hackathon"),
        order: 5,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Hackathon",
              },
              {
                language: "en",
                name: "Hackathon",
              },
            ],
          },
        },
      },
    });
    const infoCSR = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: csr.id,
        slug: parseSlug("Info CSR"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Info CSR",
              },
              {
                language: "en",
                name: "CSR Info",
              },
            ],
          },
        },
      },
    });
    const galeriCSR = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: csr.id,
        slug: parseSlug("Galeri CSR"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Galeri CSR",
              },
              {
                language: "en",
                name: "CSR Gallery",
              },
            ],
          },
        },
      },
    });
    const kontakKami = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: kontak.id,
        slug: parseSlug("Kontak Kami"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Kontak Kami",
              },
              {
                language: "en",
                name: "Contact Us",
              },
            ],
          },
        },
      },
    })
    const permohonanDokumen = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: kontak.id,
        role: 'document_request',
        slug: parseSlug("Permohonan Dokumen"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Permohonan Dokumen",
              },
              {
                language: "en",
                name: "Document Request",
              },
            ],
          },
        },
      },
    })
    const pusatBantuan = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: kontak.id,
        slug: parseSlug("Pusat Bantuan"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Pusat Bantuan",
              },
              {
                language: "en",
                name: "Help Center",
              },
            ],
          },
        },
      },
    })
    const whistleblowingSystem = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: pelaporan.id,
        slug: parseSlug("Whistleblowing System"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Whistleblowing System",
              },
              {
                language: "en",
                name: "Whistleblowing System",
              },
            ],
          },
        },
      },
    });
    const gratifikasi = await prisma.menuItem.create({
      data: {
        level: 2,
        parent_id: pelaporan.id,
        slug: parseSlug("Gratifikasi"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Gratifikasi",
              },
              {
                language: "en",
                name: "Gratification",
              },
            ],
          },
        },
      },
    });

    const hResidenceAmethystKemayoran = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: apartemen.id,
        slug: parseSlug("H Residence Amethyst Kemayoran"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "H Residence Amethyst Kemayoran",
              },
              {
                language: "en",
                name: "H Residence Amethyst Kemayoran",
              },
            ],
          },
        },
      },
    });
    const theEnviro = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: apartemen.id,
        slug: parseSlug("The Enviro"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "The Enviro",
              },
              {
                language: "en",
                name: "The Enviro",
              },
            ],
          },
        },
      },
    });
    const hResidenceMtHaryono = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: apartemen.id,
        slug: parseSlug("H Residence MT Haryono"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "H Residence MT Haryono",
              },
              {
                language: "en",
                name: "H Residence MT Haryono",
              },
            ],
          },
        },
      },
    });
    const kubikahomy = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: apartemen.id,
        slug: parseSlug("Kubikahomy"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Kubikahomy",
              },
              {
                language: "en",
                name: "Kubikahomy",
              },
            ],
          },
        },
      },
    });
    const hCitySawangan = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: perumahan.id,
        slug: parseSlug("H City Sawangan"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "H City Sawangan",
              },
              {
                language: "en",
                name: "H City Sawangan",
              },
            ],
          },
        },
      },
    });
    const hMansionPejaten = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: perumahan.id,
        slug: parseSlug("H Mansion Pejaten"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "H Mansion Pejaten",
              },
              {
                language: "en",
                name: "H Mansion Pejaten",
              },
            ],
          },
        },
      },
    });
    const harperHotel = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: hotel.id,
        slug: parseSlug("Harper Hotel"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Harper Hotel",
              },
              {
                language: "en",
                name: "Harper Hotel",
              },
            ],
          },
        },
      },
    });
    const habitareRasuna = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: hotel.id,
        slug: parseSlug("HABITARE Rasuna"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "HABITARE Rasuna",
              },
              {
                language: "en",
                name: "HABITARE Rasuna",
              },
            ],
          },
        },
      },
    });
    const astonPriority = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: hotel.id,
        slug: parseSlug("Aston Priority"),
        order: 3,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "Aston Priority",
              },
              {
                language: "en",
                name: "Aston Priority",
              },
            ],
          },
        },
      },
    });
    const upPeak = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: hotel.id,
        slug: parseSlug("UP-PEAK"),
        order: 4,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "UP-PEAK",
              },
              {
                language: "en",
                name: "UP-PEAK",
              },
            ],
          },
        },
      },
    });
    const theHTower = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: kantor.id,
        slug: parseSlug("The H Tower"),
        order: 1,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "The H Tower",
              },
              {
                language: "en",
                name: "The H Tower",
              },
            ],
          },
        },
      },
    });
    const hKTower = await prisma.menuItem.create({
      data: {
        level: 3,
        parent_id: hotel.id,
        slug: parseSlug("HK Tower"),
        order: 2,
        translations: {
          createMany: {
            data: [
              {
                language: "id",
                name: "HK Tower",
              },
              {
                language: "en",
                name: "HK Tower",
              },
            ],
          },
        },
      },
    });
  } catch (error) {
    console.error("Error in seeder:", error);
    throw error;
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
