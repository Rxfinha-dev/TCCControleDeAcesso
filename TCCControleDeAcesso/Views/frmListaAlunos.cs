using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using System.Xml.Linq;
using TCCControleDeAcesso.Models;


namespace TCCControleDeAcesso.Views
    {
        public partial class frmListaAlunos : Form
        {
            CadastroAlunos cadastroAlunos;
            int id_escola;
            public string caminho;
            string idText;


            public frmListaAlunos(int idEsc)
            {
                InitializeComponent();
                SerialPortManager.Port.DataReceived += serialPort_DataReceived;
                id_escola = idEsc;
            }

        public void CleanAll()
        {
            txtId.Clear();
            txtName.Clear();
            txtRm.Clear();
            txtIdade.Clear();
            cboCurso.SelectedIndex = -1;
            comboBox2.SelectedIndex = -1;
            txtIdOficial.Clear();
            pictureBox1.Image = null;
        }
        private void CarregarCursos()
        {
            string conexao = "server=localhost;port=3307;uid=root;pwd=etecjau;database=AccessControl;";
            string query = "SELECT nome FROM cursos where idEscola=@idEscola";

            using (MySqlConnection conn = new MySqlConnection(conexao))
            {
                try
                {
                    conn.Open();
                    MySqlCommand cmd = new MySqlCommand(query, conn);
                    cmd.Parameters.AddWithValue("@idEscola", id_escola);
                    MySqlDataReader reader = cmd.ExecuteReader();

                    while (reader.Read())
                    {
                        cboCurso.Items.Add(reader["nome"].ToString());
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Erro ao carregar cursos: " + ex.Message);
                }
            }
        }

        private void CarregarImagemDoAluno(string nome)
        {
            string connectionString = "server=localhost;port=3307;uid=root;pwd=etecjau;database=accesscontrol;"; // Atualize conforme necessário
            string query = "SELECT foto FROM alunos WHERE nome = @nome";

            using (MySqlConnection conn = new MySqlConnection(connectionString))
            {
                try
                {
                    conn.Open();
                    using (MySqlCommand cmd = new MySqlCommand(query, conn))
                    {
                        cmd.Parameters.AddWithValue("@nome", nome);

                        using (MySqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read() && !reader.IsDBNull(0))
                            {
                                byte[] imagemBytes = (byte[])reader["foto"];

                                using (MemoryStream ms = new MemoryStream(imagemBytes))
                                {
                                    pictureBox1.Image = Image.FromStream(ms);
                                }
                            }
                            else
                            {
                                pictureBox1.Image = null; // ou imagem padrão
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Erro ao carregar imagem: " + ex.Message);
                }
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
        {
            
            if (txtName.Text == string.Empty || txtRm.Text == string.Empty || txtIdade.Text == string.Empty || comboBox2.SelectedIndex == -1 || caminho == null || cboCurso.SelectedIndex == -1)
            {

                MessageBox.Show("Preencha todos os campos.", "Erro de Preenchimento.", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            cadastroAlunos = new CadastroAlunos()
            {
                Name = txtName.Text,
                rm = txtRm.Text,
                NomeCurso = cboCurso.SelectedItem.ToString(),
                idade = txtIdade.Text,
                serie = comboBox2.SelectedItem.ToString(),
                foto = File.ReadAllBytes(caminho),
                idEscola = id_escola
            };
            cadastroAlunos.cadastrarAluno();
         
            
           

            cadastroAlunos = new CadastroAlunos()
            {
                idEscola = id_escola
            };
            dgvAlunos.DataSource = cadastroAlunos.ListStudents();
            dgvAlunos.Columns["id"].Visible = false;
            CleanAll();

            int id = cadastroAlunos.idArduino;
            SerialPortManager.Port.Write("!enroll" + id + "#");
        }

        private void frmListaAlunos_Load(object sender, EventArgs e)
        {
            cadastroAlunos = new CadastroAlunos()
            {
                idEscola = id_escola
            };
            dgvAlunos.DataSource = cadastroAlunos.ListStudents();
            dgvAlunos.Columns["id"].Visible = false;

            CleanAll();
            CarregarCursos();
        }

        private void linkSelectPhoto_LinkClicked(object sender, LinkLabelLinkClickedEventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Filter = "Imagens|*.jpg;*.jpeg;*.png;*.bmp";

            if (ofd.ShowDialog() == DialogResult.OK)
            {
                caminho = ofd.FileName;
                pictureBox1.ImageLocation = caminho; // opcional: mostra a imagem
            }
        }

        private void dgvAlunos_CellClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                DataGridViewRow row = dgvAlunos.Rows[e.RowIndex];

                // Recupere os valores das células


                idText = row.Cells["id"].Value.ToString();

                string nome = row.Cells["nome"].Value.ToString();
                string rm = row.Cells["rm"].Value.ToString();
                string idade = row.Cells["idade"].Value.ToString();
                object curso = row.Cells["curso"].Value;
                object serie = row.Cells["serie"].Value;

                txtId.Text = idText;
                txtName.Text = nome;
                txtRm.Text = rm;
                txtIdade.Text = idade;
                cboCurso.SelectedItem = curso;
                comboBox2.SelectedItem = serie;

                CarregarImagemDoAluno(nome);



            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (idText == null)
            {
                return;
            }
            else
            {

                cadastroAlunos = new CadastroAlunos()
                {
                    Id = int.Parse(idText)
                };
                cadastroAlunos.Delete();

                cadastroAlunos = new CadastroAlunos()
                {
                    idEscola = id_escola
                };
                dgvAlunos.DataSource = cadastroAlunos.ListStudents();
                dgvAlunos.Columns["id"].Visible = false;
                CleanAll();
            }
        }

        private void serialPort_DataReceived(object sender, EventArgs e)
        {
            string received = SerialPortManager.Port.ReadLine();

            acao.Invoke(new Action(() => {
                if (received.StartsWith("!enrolling"))
                {
                    received = received.Replace("!enrolling", "");
                    received = received.Replace("#", "");
                    acao.Text = "Cadastrando o ID " + received;
                }
                else if (received.StartsWith("!placeFinger#"))
                {
                    acao.Text = "Coloque o dedo no sensor";
                }
                else if (received.StartsWith("!imageTaken#"))
                {
                    acao.Text = "Dedo capturado";
                }
                else if (received.StartsWith("!removeFinger#"))
                {
                    acao.Text = "Tire o dedo do sensor";
                }
                else if (received.StartsWith("!enrolled"))
                {
                    received = received.Replace("!enrolled", "");
                    received = received.Replace("#", "");
                    acao.Text = "ID" + received + " cadastrado";
                }
            }));
        }
    }
}
