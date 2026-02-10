export interface PopularCollegeApplicationType {
  value: string;
  label: string;
  deadline: string;
}

export interface PopularCollege {
  id: string;
  name: string;
  location: string;
  applicationTypes: PopularCollegeApplicationType[];
}

export const popularCollegeCatalog: PopularCollege[] = [
  {
    id: 'stanford',
    name: 'Stanford University',
    location: 'Stanford, CA',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ],
  },
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    location: 'Cambridge, MA',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ],
  },
  {
    id: 'harvard',
    name: 'Harvard University',
    location: 'Cambridge, MA',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ],
  },
  {
    id: 'yale',
    name: 'Yale University',
    location: 'New Haven, CT',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 2' },
    ],
  },
  {
    id: 'princeton',
    name: 'Princeton University',
    location: 'Princeton, NJ',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ],
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    location: 'New York, NY',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ],
  },
  {
    id: 'uchicago',
    name: 'University of Chicago',
    location: 'Chicago, IL',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 4' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ],
  },
  {
    id: 'duke',
    name: 'Duke University',
    location: 'Durham, NC',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ],
  },
  {
    id: 'penn',
    name: 'University of Pennsylvania',
    location: 'Philadelphia, PA',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ],
  },
  {
    id: 'northwestern',
    name: 'Northwestern University',
    location: 'Evanston, IL',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ],
  },
  {
    id: 'brown',
    name: 'Brown University',
    location: 'Providence, RI',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ],
  },
  {
    id: 'dartmouth',
    name: 'Dartmouth College',
    location: 'Hanover, NH',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ],
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    location: 'Ithaca, NY',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 2' },
    ],
  },
  {
    id: 'vanderbilt',
    name: 'Vanderbilt University',
    location: 'Nashville, TN',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ],
  },
  {
    id: 'rice',
    name: 'Rice University',
    location: 'Houston, TX',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ],
  },
  {
    id: 'notredame',
    name: 'University of Notre Dame',
    location: 'Notre Dame, IN',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ],
  },
  {
    id: 'washu',
    name: 'Washington University in St. Louis',
    location: 'St. Louis, MO',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 4' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ],
  },
  {
    id: 'emory',
    name: 'Emory University',
    location: 'Atlanta, GA',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ],
  },
  {
    id: 'georgetown',
    name: 'Georgetown University',
    location: 'Washington, DC',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 10' },
    ],
  },
  {
    id: 'usc',
    name: 'University of Southern California',
    location: 'Los Angeles, CA',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 15' },
    ],
  },
  {
    id: 'berkeley',
    name: 'UC Berkeley',
    location: 'Berkeley, CA',
    applicationTypes: [{ value: 'rd', label: 'Regular Decision', deadline: 'Nov 30' }],
  },
  {
    id: 'ucla',
    name: 'UCLA',
    location: 'Los Angeles, CA',
    applicationTypes: [{ value: 'rd', label: 'Regular Decision', deadline: 'Nov 30' }],
  },
  {
    id: 'umich',
    name: 'University of Michigan',
    location: 'Ann Arbor, MI',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Feb 1' },
    ],
  },
  {
    id: 'nyu',
    name: 'New York University',
    location: 'New York, NY',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ],
  },
  {
    id: 'cmu',
    name: 'Carnegie Mellon University',
    location: 'Pittsburgh, PA',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ],
  },
];
