import { useEffect, useState } from 'react'
import Circles from '../components/Circles'
import Modal from '../components/Modal';
import UIButton from '../components/UIButton';
import UITextField from '../components/UITextField';
import { UISelect } from '../components/UISelect';
import { DockMenu } from '../components/DockMenu';
import { useNavigate } from 'react-router-dom';
import { GearIcon } from '../utils/iconsUtils';
import { useApi } from '../context/ApiContext';
import { Spinner } from '../components/Spinner';
import type { SkillInfo } from '../interfaces/skills.interfaces';
import { ScreenSpinner } from '../components/ScreenSpinnerProps';
import { SkillCard } from '../components/skills/SkillCard';

const Skills = () => {

  const navigate = useNavigate();

  const { requestAuth, loading } = useApi();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [skills, setSkills] = useState<SkillInfo[]>([]);

  const [name, setName] = useState<string>("");
  const [name2, setName2] = useState<string>("");
  const [city, setCity] = useState<string>("");



  useEffect(() => {

    const getSkillsByUser = async () => {
      const data = await requestAuth<any>("/api/skills", {
        method: "GET",
      });
      if (!data) return;

      console.log(data);
      setSkills(data);

    }

    getSkillsByUser();

  }, [])


  const handleDelete = (skillId: number) => {
    console.log("skill delete: " + skillId);
    
  }

  if (loading) return <div className='h-screen'><ScreenSpinner /></div>

  return (
    <>
      <div className="page-bg">
        <Circles />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">

        <DockMenu
          items={[
            { label: 'Home', onClick: () => navigate('/') },
            { label: 'Profile', onClick: () => navigate('/profile') },
            { label: 'Settings', icon: <GearIcon size={16} />, onClick: () => navigate('/profile') },
          ]}
        />


        <p className='text-center text-3xl'>{skills.length === 0 ? 'No skills yet, create one' : 'Your skills'}</p>
        <div className='gap-3 grid grid-cols-1 md:grid-cols-2'>
                  {skills.map((e, index) => (
          <SkillCard
            key={e.id}
            skill={e}
            index={index}
            onClick={(s) => navigate(`/skills/${s.id}`)}
            onDelete={(s) => handleDelete(s.id)}
          />
        ))}
        </div>
        here
        <button
          type='button'
          className='bg-blue-800 p-3 w-20 rounded-2xl cursor-pointer'
          onClick={() => setShowModal(true)}
        >
          open
        </button>

        <UIButton
          type='button'
          variant='primary'
          size='small'
          onClick={() => setShowModal(true)}
        >
          Open
        </UIButton>

        <UIButton
          type='button'
          variant='secondary'
          size='medium'
          onClick={() => setShowModal(true)}
        >
          secondary
        </UIButton>


        <div className='w-full md:w-4xl rise glass glass-hi  p-5 rounded-2xl'>
          <p className='mb-0.5'>text field</p>
          <UITextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Technology"
          />

          <UITextField
            label="Name"
            value={name2}
            onChange={e => setName2(e.target.value)}
            placeholder="e.g. Technology"
            multiline={true}
            rows={10}
          />
          <label
            className={`text-[13px] text-white/70 mb-10 pb-10`}
          >
            selesto an option
          </label>
          <UISelect value={city} onChange={setCity} placeholder="Choose a city">
            <option value="pue">Puebla</option>
            <option value="cdmx">Mexico City</option>
            <option value="gdl" disabled>Guadalajara</option>
          </UISelect>
        </div>



        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          className="w-full md:w-4xl"
          title='MOdal'
        >
          <div className=" p-3">
            <p>This is the content</p>
            <p>This is the content</p><p>This is the content</p><p>This is the content</p><p>This is the content</p>
            <UITextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Technology"
            />

            <label
              className={`text-[13px] text-white/70 mb-10 pb-10`}
            >
              selesto an option
            </label>
            <UISelect value={city} onChange={setCity} placeholder="Choose a city">
              <option value="pue">Puebla</option>
              <option value="cdmx">Mexico City</option>
              <option value="gdl" disabled>Guadalajara</option>
            </UISelect>

            <UITextField
              label="Name"
              value={name2}
              onChange={e => setName2(e.target.value)}
              placeholder="e.g. Technology"
              multiline={true}
              rows={10}
            />

            <UITextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Technology"
            />
            <UITextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Technology"
            />
            <UITextField
              label="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Technology"
            />
          </div>
        </Modal>
      </main>

    </>
  )
}

export default Skills