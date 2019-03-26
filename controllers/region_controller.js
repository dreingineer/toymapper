const db = require('../models/index');
const utils = require('../helpers/utils');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const sorter = require('../helpers/sorter');

const Region = db.Region;
// const Province = db.Province;


// import csv for region
const importcsv = async (req, res) => {
    const file = req.file ? req.file.path : null;
    console.log('File', file);
    if(!file) return ReE(res, { message: 'CSV file not found'}, 400);

    const csv = require('../helpers/csv_validator');

    const headers = {
        code: '',
        name: ''
    }

    async function insert(json) {
        let err, region;
        [err, region] = await to(Region.bulkCreate(json));
        if(err) return ReE(res, err, 500);

        return ReS(res, {
            message: 'Successfully imported CSV file',
            data: region
        }, 200);
    }

    async function validateJSON(json) {
        insert(json);
    }

    function start() {
        csv(file, headers)
        .then( result => {
            validateJSON(result);
        })
        .catch(err => {
            return ReE(res, {
                message: 'Failed to import csv file',
                data: err
            }, 400);
        });
    }
    start();
}

// export csv
const exportcsv = async (req, res) => {
    let err, region;

    [err, region] = await to(Region.findAll());
    if(err) return ReE(res, err, 500);
    if(!region) return ReE(res, {message:'No data to download'}, 400);

    region = utils.clone(region);

    const json2csv = require('json2csv').Parser;
    const parser = new json2csv({encoding:'utf-8', withBOM: true});
    const csv = parser.parse(region);

    res.setHeader('Content-disposition', 'attachment; filename=Region.csv');
    res.set('Content-type','text/csv');
    res.send(csv);
}

// Pagination
const getRegionList = (req, res) => {
    let limit = 10;
    let offset = 0;
    Region.findAndCountAll()
    .then(data => {
        let page = req.params.page;
        let pages = Math.ceil(data.count / limit);
            offset = limit * (page -1);
        Region.findAll({
            attributes: ['id','name','code'],
            limit: limit,
            offset: offset,
            $sort: { id: 1}
        })
        .then( regions => {
            res.status(200).json({'result': regions, 'count':data.count, 'pages': pages});
        });
    })
    .catch(err => {
        res.status(500).send('Internal server error');
    });
}

// get all regions
const getAll = (req, res, next) => {
    Region.findAll({
        // include: [Province],
        paranoid: false
    }).then(regions => {
        res.send(regions);
    }).catch(next);
}

// post a region
const post = (req, res, next) => {
    Region.create(req.body)
    .then( region => {
        res.send(region);
    }).catch(next);
}

// find region by id
const findById = (req, res, next) => {
    let id = req.params.id;
    Region.findById(id)
    .then(region => {
        if(!region) res.sendStatus(404);
        else {
            res.send(region);
        }
    })
    .catch(next);
}

// update a particular region
const updateById = (req,res,next) => {
    Region.update({...req.body}, {where: {id: req.params.id}})
    .then(() => {
        res.send('Updated a region successfully.');
    }).catch(next);
}

// delete a region by id
const deleteById = (req, res, next) => {
    const id = req.params.id;
    Region.destroy({
        where: {id: id}
    })
    .then(() => {
        res.send(`Deleted region ${id}`);
    }).catch(next);
}

// search region
const search = async (req, res) => {
    // search radagast version
    // res.setHeader('Content-type','application/json');
    // const {
    //     id,
    //     name,
    //     code,
    //     createdAt,
    //     updatedAt,
    //     deletedAt
    // } = req.query;
    // [err, region] = await to(Region.findAll({
    //     where: {
    //         [Op.or]: [{'id':id},{'name':name},{'code':code},{'createdAt':createdAt},
    //                 {'updatedAt':updatedAt},{'deletedAt':deletedAt}]
    //     }
    // }));

    // return ReS(res, {'Region': region});

    // search v2 own version
    const {
        id,
        name,
        code
    } = req.query;
    [err, regions] = await to(Region.findAll({
        attributes: [
            [db.sequelize.fn('concat',db.sequelize.col('id'),',', db.sequelize.col('name'),',',db.sequelize.col('code')), 'Results: ']
        ],
        where: {
            [Op.or]: [
                {id: {[Op.like]: '%'+id+'%'}},
                {name: {[Op.like]: '%'+name+'%'}},
                {code: {[Op.like]: '%'+code+'%'}}
            ]
        },
        paranoid: false,
        limit: 10
    }));
    if(err) return ReE(res, err, 500);
    return ReS(res, {
        message: 'Searched: ',
        data: regions
    }, 200);
};

// filter regions
const filter = async (req, res) => {
    let reqQuery = req.query;
    let reqQuery_Sort = req.query.sortBy;
    let condition = {};
    let sort = [];

    if(Object.keys(reqQuery).length > 0) {
        if(reqQuery_Sort) {
            sort = await sorter.convertToArrSort(reqQuery_Sort);
            delete reqQuery.sortBy;
        }
        condition = reqQuery;
    }

    Region.findAll({
        attributes: [
            [db.sequelize.fn('concat', db.sequelize.col('id'),',', db.sequelize.col('name'),',', db.sequelize.col('code')), 'Filter Result(s):']
        ],
        where: condition,
        order: sort,
        paranoid: false
    })
    .then( regions => {
        res.send(regions);
    })
    .catch( err => {
        console.log(err);
    });
};

module.exports = {
    importcsv,
    exportcsv,
    getRegionList,
    getAll,
    post,
    findById,
    updateById,
    deleteById,
    search,
    filter
}
