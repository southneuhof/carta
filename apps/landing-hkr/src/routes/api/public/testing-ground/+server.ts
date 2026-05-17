import prisma from '$lib/utils/prisma.js';
import { success } from '$lib/utils/response';

export async function PUT({cookies}) {
  return success({message: 'Success', cookies: cookies.getAll()})
}

export async function GET({cookies}) {
  return success({message: 'Success', cookies: cookies.getAll()})
}

export async function POST({cookies}) {
  return success({message: 'Success', cookies: cookies.getAll()})
}

export async function DELETE({cookies}) {
  return success({message: 'Success', cookies: cookies.getAll()})
}

// export async function GET({}) {
  // const data = await prisma.role.findFirst({
  //   where: {
  //     id: 5
  //   },
  //   include: {
  //     permissions: true
  //   }
  // })

  // const templateObject = {
  //   "role_group_id": 3,
  //   "permissions": [
  //     {
  //         "code": "create-article",
  //         "name": "create article",
  //         "description": "Melakukan create terhadap article"
  //     },
  //     {
  //         "code": "detail-article",
  //         "name": "detail article",
  //         "description": "Melakukan detail terhadap article"
  //     },
  //     {
  //         "code": "view-article",
  //         "name": "view article",
  //         "description": "Melakukan view terhadap article"
  //     },
  //     {
  //         "code": "update-article",
  //         "name": "update article",
  //         "description": "Melakukan update terhadap article"
  //     },
  //     {
  //         "code": "view-articleCategory",
  //         "name": "view articleCategory",
  //         "description": "Melakukan view terhadap articleCategory"
  //     },
  //     {
  //         "code": "detail-menuItem",
  //         "name": "detail menuItem",
  //         "description": "Melakukan detail terhadap menuItem"
  //     },
  //     {
  //         "code": "view-menuItem",
  //         "name": "view menuItem",
  //         "description": "Melakukan view terhadap menuItem"
  //     }
  //   ]
  // }

  // First, ensure all permissions exist in the database
  // const permissionCodes = templateObject.permissions.map(p => p.code);
  // const existingPermissions = await prisma.permission.findMany({
  //   where: {
  //     code: { in: permissionCodes }
  //   }
  // });

  // const names = [
  //   "H Residence Kemayoran Amethyst Tower",
  //   "The Enviro",
  //   "H Residence MT Haryono",
  //   "Kubikahomy",
  //   "Harper Hotel",
  //   "HABITARE Rasuna",
  //   "Aston Priority",
  //   "UP-PEAK",
  //   "Izi Cozi Kemayoran",
  //   "Izi Cozi Jababeka",
  //   "The H Tower",
  //   "HK Tower",
  //   "Rest Area Terpeka",
  //   "Rest Area Inprabu",
  //   "Rest Area Permai"
  // ];

  // for (const name of names) {
  //   const newRole = await prisma.role.create({
  //     data: {
  //       name: `Admin ${name}`,
  //       role_group_id: templateObject.role_group_id,
  //       permissions: {
  //         connect: existingPermissions.map(p => ({ code: p.code }))
  //       }
  //     },
  //     include: {
  //       permissions: true
  //     }
  //   });
  //   console.log(newRole);
  // }

  // // Create the role with permissions
  // const newRole = await prisma.role.create({
  //   data: {
  //     name: "Admin H Mansion Pejaten", // Set your role name here
  //     role_group_id: templateObject.role_group_id,
  //     permissions: {
  //       connect: existingPermissions.map(p => ({ code: p.code }))
  //     }
  //   },
  //   include: {
  //     permissions: true
  //   }
  // });

  // return success({});
// }