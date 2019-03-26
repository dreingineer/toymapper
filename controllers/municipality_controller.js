const db = require('../models/index')
const utils = require('../helpers/utils');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const sorter = require('../helpers/sorter');

const Municipality = db.Municipality;

// import csv
const importcsv = async (req, res) => {
    //------------------------------------------------------
    const file = req.file ? req.file.path : null;
    console.log('FILE', file);
    if(!file) return ReE(res, { message: 'CSV file not found'}, 400);

    const csv = require('../helpers/csv_validator/');

    const headers  = {
        code: '',
        name: '',
        provinceId: ''
    };
    
    async function insert(json) {
        let err, municipality;
        [err, municipality] = await to(Municipality.bulkCreate(json));
        if(err) return ReE(res, err, 500);

        return ReS(res, {
            message: 'Successfully imported CSV file',
            data: municipality
        }, 200);
    }

    async function validateJSON(json) {
        insert(json);
    }

    function start() {
        csv(file, headers).then( result => {
            validateJSON(result);
        }).catch(err => {
            return ReE(res, {
                message: 'Failed to import csv file.',
                data: err
            }, 400);
        });
    }

    start();
}

// export csv
const exportcsv = async (req, res) => {
    let err, municipality;

    [err, municipality] = await to(Municipality.findAll());
    if(err) return ReE(res, err, 500);
    if(!municipality) return ReE(res, {message: 'No data to download.'}, 400);
 
    municipality = utils.clone(municipality);

    const json2csv = require('json2csv').Parser;
    const parser = new json2csv({encoding: 'utf-8', withBOM: true});
    const csv = parser.parse(municipality);

    res.setHeader('Content-disposition', 'attachment; filename=Municipality.csv');
    res.set('Content-Type','text/csv');
    // res.set('application/octet-stream', 'text/csv');
    res.send(csv);
}

// pagination
const getMunicipalityList = (req, res, next) => {
    let limit = 10;
    let offset = 0;
    Municipality.findAndCountAll()
    .then(data => {
        let page = req.params.page;
        let pages = Math.ceil(data.count / limit);
            offset = limit * (page -1);
        Municipality.findAll({
            attributes: ['id','name','code','provinceId'],
            limit: limit,
            offset: offset,
            $sort: { id: 1}
        })
        .then( municipalities => {
            res.status(200).json({'result': municipalities, 'count':data.count, 'pages': pages});
        });
    })
    .catch(err => {
        res.status(500).send('Internal server error');
    });
}

// get all municipality
const getAll = (req, res, next) => {
    Municipality.findAll({
        paranoid: false
    }).then(municipalities => {
        res.send(municipalities);
    }).catch(next);
}

// post a municipality
const post = (req, res, next) => {
    Municipality.create(req.body)
    .then( municipality => {
        res.send(municipality);
    }).catch(next);
}

// find municipality by id
const findById = (req, res, next) => {
    let id = req.params.id;
    Municipality.findById(id)
    .then(municipality => {
        if(!municipality) res.sendStatus(404);
        else {
            res.send(municipality);
        }
    })
    .catch(next);
}

// update a particular municipality
const updateById = (req,res,next) => {
    Municipality.update({...req.body}, {where: {id: req.params.id}})
    .then(() => {
        res.send('Updated a municipality successfully.');
    }).catch(next);
}

// delete a municipality by id
const deleteById = (req, res, next) => {
    const id = req.params.id;
    Municipality.destroy({
        where: {id: id}
    })
    .then(() => {
        res.send('Deleted a municipality!');
    }).catch(next);
}

// search municipality
const search = async (req, res) => {
    // res.setHeader('Content-type', 'application/json');
    // const {
    //     id,
    //     name,
    //     code,
    //     createdAt,
    //     updatedAt,
    //     deletedAt,
    //     provinceId
    // } = req.query;
    // [err, municipality] = await to(Municipality.findAll({
    //     where: {
    //         [Op.or] : [{'id':id},{'name':name},{'code':code},{'createdAt':createdAt},
    //                 {'updatedAt':updatedAt},{'deletedAt':deletedAt},{'provinceId':provinceId}]
    //     }
    // }));

    // return ReS(res, {'Municipality': municipality});

    // search v2 own version
    const {
        id,
        name,
        code,
        provinceId
    } = req.query;
    [err, municipalities] = await to(Municipality.fundAll({
        attributes: [
            [db.sequelize.fn('concat', db.sequelize.col('id'),',', db.sequelize.col('name'),',', db.sequelize.col('code'),',', db.sequelize.col('provinceId')), 'Result(s): ']
        ],
        where: {
            [Op.or]: [
                {id: {[Op.like]: '%'+id+'%'}},
                {name: {[Op.like]: '%'+name+'%'}},
                {code: {[Op.like]: '%'+code+'%'}},
                {provinceId: {[Op.like]: '%'+provinceId+'%'}}
            ]
        },
        paranoid: false,
        limit: 10
    }));
    if(err) return ReE(res, err, 500);
    return ReS(res, {
        message: 'Searched: ',
        data: municipalities
    }, 200);
};

// filter municipalities
const filter = async (req, res) => {
    let reqQuery = req.query;
    let reqQuery_Sort = req.query.sortBy;
    let condition = {};
    let sort = [];

    if(Object.keys(reqQuery).length > 0) {
        if(reqQuery_Sort) {
            sort = await sorter.converToArrSort(reqQuery_Sort);
            delete reqQuery.sortBy;
        }
        condition = reqQuery;
    }

    Municipality.findAll({
        attributes: [
            [db.sequelize.fn('concat', db.sequelize.col('id'),',', db.sequelize.col('name'),',', db.sequelize.col('code'),',', db.sequelize.col('provinceId')), 'Filter Result(s): ']
        ],
        where: condition,
        order: sort,
        paranoid: false
    })
    .then( municipalities => {
        res.send(municipalities);
    })
    .catch( err => {
        console.log(err);
    });
};

module.exports = {
    importcsv,
    exportcsv,
    getMunicipalityList,
    getAll,
    post,
    findById,
    updateById,
    deleteById,
    search,
    filter
}
