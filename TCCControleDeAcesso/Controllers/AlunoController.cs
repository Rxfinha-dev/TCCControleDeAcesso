using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml.Linq;
using TCCControleDeAcesso.Models;
using TCCControleDeAcesso.Views;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.ListView;

namespace TCCControleDeAcesso.Controllers
{
    public class AlunoController
    {
        Aluno alunoClass = new Aluno();
        public void cadastrarAluno()
        {
            try
            {
                //Banco.OpenConnection();

                Banco.Command = new MySqlCommand("select id from escolas where nome=@nome", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@nome", alunoClass.Name);

                using (MySqlDataReader reader = Banco.Command.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        alunoClass.idArduino = reader.GetInt32("id");
                        frmListaAlunos tela = new frmListaAlunos("", 0);
                        tela.id_arduino = alunoClass.idArduino;
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Erro ao guardar o id", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void Insert()
        {
            frmListaAlunos FrmListaAlunos = new frmListaAlunos("", 0);

            try
            {
                //Banco.OpenConnection();

                Banco.Command = new MySqlCommand("insert into Alunos(id, nome, rm,idade, idEscola, curso, serie, foto) " +
                    "values(@id, @nome, @rm, @idade,@idEscola,@Curso, @serie, @foto)", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", alunoClass.Id);
                Banco.Command.Parameters.AddWithValue("@nome", alunoClass.Name);
                Banco.Command.Parameters.AddWithValue("@rm", alunoClass.rm);
                Banco.Command.Parameters.AddWithValue("@idade", alunoClass.idade);
                Banco.Command.Parameters.AddWithValue("@serie", alunoClass.serie);
                Banco.Command.Parameters.AddWithValue("@idEscola", alunoClass.idEscola);
                Banco.Command.Parameters.AddWithValue("@Curso", alunoClass.NomeCurso);
                Banco.Command.Parameters.Add("@foto", MySqlDbType.LongBlob).Value = alunoClass.foto;
                //Banco.Command.Parameters.AddWithValue("@digital", digital);
                Banco.Command.ExecuteNonQuery();

                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void Delete()
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("delete from Alunos where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", alunoClass.Id);
                Banco.Command.ExecuteNonQuery();
                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Deletar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void Update()
        {
            try
            {

                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("update Alunos set nome = @nome, rm = @rm, serie = @serie, idEscola = @idEscola, Curso = @Curso where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", alunoClass.Id);
                Banco.Command.Parameters.AddWithValue("@nome", alunoClass.Name);
                Banco.Command.Parameters.AddWithValue("@rm", alunoClass.rm);
                Banco.Command.Parameters.AddWithValue("@serie", alunoClass.serie);
                Banco.Command.Parameters.AddWithValue("@idEscola", alunoClass.idEscola);
                Banco.Command.Parameters.AddWithValue("@Curso", alunoClass.NomeCurso);

                Banco.Command.ExecuteNonQuery();
                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Atualizar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void UpdateFoto()
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("update Alunos set foto=@foto where id=@id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", alunoClass.Id);
                Banco.Command.Parameters.Add("@foto", MySqlDbType.LongBlob).Value = alunoClass.foto;

                Banco.Command.ExecuteNonQuery();
                //Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Atualizar Foto!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        public DataTable ListStudents()
        {
            try
            {
                //Banco.OpenConnection();
                Banco.Command = new MySqlCommand("select id,nome, rm,idade, serie, curso from Alunos where idEscola=@idEscola", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@idEscola", alunoClass.idEscola);
                Banco.DataAdapter = new MySqlDataAdapter(Banco.Command);
                Banco.datTable = new DataTable();
                Banco.DataAdapter.Fill(Banco.datTable);
                //Banco.CloseConnection();
                return Banco.datTable;
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Listar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return null;
            }
        }

        

        
    }
}
