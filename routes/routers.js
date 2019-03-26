'use strict';

const express      = require('express');
const multer       = require('multer');

const router       = express.Router();
const upload       = multer({ dest: './uploads/'})
// var upload         = multer({ storage:storage });

const region       = require('../controllers/region_controller');
const province     = require('../controllers/province_controller');
const municipality = require('../controllers/municipality_controller');
const mapper       = require('../controllers/mapper_controller');

router.post('/regions/postRegion',                              region.post);
router.get('/regions/getRegions',                               region.getAll);
router.get('/regions/findRegion/:id',                           region.findById);
router.put('/regions/updateRegion/:id',                         region.updateById);
router.delete('/regions/delete/:id',                            region.deleteById);
router.get('/regions/export',                                   region.exportcsv);
router.post('/regions/import', upload.single('file') ,          region.importcsv);
router.get('/regions/pagination/:page',                         region.getRegionList);
router.get('/regions/search',                                   region.search);
router.get('/regions/filter',                                   region.filter);

router.post('/provinces/postProvince',                          province.post);
router.get('/provinces/getProvinces',                           province.getAll);
router.get('/provinces/findProvince/:id',                       province.findById);
router.put('/provinces/updateProvince/:id',                     province.updateById);
router.delete('/provinces/delete/:id',                          province.deleteById);
router.get('/provinces/export',                                 province.exportcsv);
router.post('/provinces/import', upload.single('file') ,        province.importcsv);
router.get('/provinces/pagination/:page',                       province.getProvinceList);
router.get('/provinces/search',                                 province.search);
router.get('/provinces/filter',                                 province.filter);

router.post('/municipalities/postMunicipality',                 municipality.post);
router.get('/municipalities/getMunicipalities',                 municipality.getAll);
router.get('/municipalities/findMunicipality/:id',              municipality.findById);
router.put('/municipalities/updateMunicipality/:id',            municipality.updateById);
router.delete('/municipalities/delete/:id',                     municipality.deleteById);
router.get('/municipalities/export',                            municipality.exportcsv);
router.post('/municipalities/import', upload.single('file') ,   municipality.importcsv);
router.get('/municipalities/pagination/:page',                  municipality.getMunicipalityList);
router.get('/municipalities/search',                            municipality.search);
router.get('/municipalities/filter',                            municipality.filter);

router.get('/mapper/all', mapper.getLocs);

module.exports = router;
